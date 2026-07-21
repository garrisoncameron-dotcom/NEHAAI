(function () {
  const DEFAULT_CONFIG = {
    enabled: false,
    mirrorWrites: true,
    readFromSupabase: false,
    url: "",
    anonKey: "",
    communityImageBucket: ""
  };

  function getConfig() {
    return { ...DEFAULT_CONFIG, ...(window.NEHA_SUPABASE_CONFIG || {}) };
  }

  function isEnabled() {
    const config = getConfig();
    return Boolean(config.enabled && config.url && config.anonKey);
  }

  function endpoint(path) {
    return `${getConfig().url.replace(/\/$/, "")}${path}`;
  }

  function headers(extra = {}) {
    const config = getConfig();
    return {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`,
      "Content-Type": "application/json",
      ...extra
    };
  }

  function queryString(params = {}) {
    return Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&");
  }

  async function insertRow(table, row) {
    const response = await fetch(endpoint(`/rest/v1/${table}`), {
      method: "POST",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(row)
    });
    if (!response.ok) {
      throw new Error(`Supabase insert failed for ${table}: ${response.status}`);
    }
  }

  async function selectRows(table, params = {}) {
    const qs = queryString(params);
    const response = await fetch(endpoint(`/rest/v1/${table}${qs ? `?${qs}` : ""}`), {
      method: "GET",
      headers: headers()
    });
    if (!response.ok) {
      throw new Error(`Supabase select failed for ${table}: ${response.status}`);
    }
    return response.json();
  }

  async function patchRows(table, params = {}, row = {}) {
    const qs = queryString(params);
    const response = await fetch(endpoint(`/rest/v1/${table}${qs ? `?${qs}` : ""}`), {
      method: "PATCH",
      headers: headers({ Prefer: "return=minimal" }),
      body: JSON.stringify(row)
    });
    if (!response.ok) {
      throw new Error(`Supabase update failed for ${table}: ${response.status}`);
    }
  }

  function text(value) {
    return value == null ? "" : String(value);
  }

  function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function timestamp(value, fallback) {
    const nextValue = value || fallback || "";
    return nextValue ? String(nextValue) : null;
  }

  function jsonSafe(value) {
    return value == null ? null : value;
  }

  function userFields(payload) {
    return {
      full_name: text(payload.name),
      agency: text(payload.agency),
      email: text(payload.email)
    };
  }

  function eventPayload(payload) {
    const clone = { ...payload };
    if (clone.imageData) {
      clone.imageData = `[image omitted from event payload: ${text(clone.imageMime) || "image"}]`;
    }
    return clone;
  }

  function localId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function dataUrlToBytes(dataUrl) {
    const match = text(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const bytes = Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0));
    return { mimeType: match[1], bytes };
  }

  async function uploadCommunityImage(payload, postId) {
    const config = getConfig();
    if (!config.communityImageBucket || !payload.imageData) return "";
    const image = dataUrlToBytes(payload.imageData);
    if (!image) return "";
    const extension = image.mimeType.includes("png") ? "png" : image.mimeType.includes("webp") ? "webp" : "jpg";
    const path = `${postId}/${Date.now()}.${extension}`;
    const response = await fetch(endpoint(`/storage/v1/object/${config.communityImageBucket}/${path}`), {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        "Content-Type": image.mimeType,
        "x-upsert": "false"
      },
      body: image.bytes
    });
    if (!response.ok) {
      throw new Error(`Supabase image upload failed: ${response.status}`);
    }
    return endpoint(`/storage/v1/object/public/${config.communityImageBucket}/${path}`);
  }

  function displayName(name) {
    const parts = text(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "NEHA attendee";
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`;
  }

  function normalizeCategory(category) {
    const value = text(category).trim().toLowerCase();
    if (value === "kc photos" || value === "kc-images") return "kc-images";
    if (value === "find the violation" || value === "find-violation") return "find-violation";
    if (value === "meet new eh friends" || value === "meet-friends") return "meet-friends";
    if (value === "unique problems" || value === "unique-problems") return "unique-problems";
    return value || "unique-problems";
  }

  function leadRow(payload) {
    return {
      ...userFields(payload),
      source: text(payload.source),
      page_url: text(payload.page),
      submitted_at: text(payload.submittedAt || payload.createdAt || new Date().toISOString())
    };
  }

  function mapPayload(payload) {
    const type = text(payload.type || "lead");
    const rows = [];

    if (type === "lead") {
      rows.push(["lead_captures", leadRow(payload)]);
    } else if (type === "demoRequest") {
      rows.push(["demo_requests", {
        ...userFields(payload),
        phone: text(payload.phone),
        state: text(payload.state),
        notes: text(payload.notes),
        source: text(payload.source),
        page_url: text(payload.page),
        requested_at: timestamp(payload.requestedAt, new Date().toISOString())
      }]);
    } else if (type === "triviaScore") {
      rows.push(["trivia_scores", {
        ...userFields(payload),
        display_name: displayName(payload.name),
        board_id: text(payload.boardId || "food"),
        board_name: text(payload.boardName),
        score: number(payload.score),
        total: number(payload.total),
        achievement: text(payload.achievement),
        hints_used: number(payload.hintsUsed),
        round_id: text(payload.roundId),
        started_at: timestamp(payload.startedAt),
        completed_at: timestamp(payload.completedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    } else if (type === "drinkRedemption") {
      rows.push(["drink_redemptions", {
        ...userFields(payload),
        display_name: displayName(payload.name),
        redemption_code: text(payload.code || payload.drinkCode),
        redeemed_at: timestamp(payload.redeemedAt || payload.createdAt, new Date().toISOString()),
        issued_at: timestamp(payload.issuedAt, new Date().toISOString()),
        status: "Issued",
        source: text(payload.source),
        page_url: text(payload.page),
        user_agent: text(payload.userAgent)
      }]);
    } else if (type === "drinkServed") {
      rows.push(["drink_redemption_events", {
        redemption_code: text(payload.code || payload.drinkCode),
        event_type: "served",
        served_by: text(payload.servedBy),
        recorded_at: timestamp(payload.servedAt, new Date().toISOString()),
        raw_payload: eventPayload(payload)
      }]);
    } else if (type === "communityPost") {
      const postId = text(payload.postId || localId("post"));
      rows.push(["community_posts", {
        post_id: postId,
        category: normalizeCategory(payload.category),
        title: text(payload.title),
        message: text(payload.message),
        image_name: text(payload.imageName),
        image_mime: text(payload.imageMime),
        image_url: text(payload.imageUrl),
        share_email: text(payload.shareEmail).toLowerCase() === "yes",
        display_name: displayName(payload.name),
        ...userFields(payload),
        status: "Visible",
        posted_at: timestamp(payload.postedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    } else if (type === "communityReply") {
      rows.push(["community_replies", {
        reply_id: text(payload.replyId || localId("reply")),
        post_id: text(payload.postId),
        message: text(payload.message),
        display_name: displayName(payload.name),
        ...userFields(payload),
        status: "Visible",
        posted_at: timestamp(payload.postedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    } else if (type === "sessionQuestion") {
      rows.push(["session_questions", {
        question_id: text(payload.questionId || localId("question")),
        session_id: text(payload.sessionId),
        session_title: text(payload.sessionTitle),
        session_time: text(payload.sessionTime),
        title: text(payload.title || payload.question),
        message: text(payload.message || payload.question),
        display_name: displayName(payload.name),
        ...userFields(payload),
        status: "Visible",
        posted_at: timestamp(payload.postedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    } else if (type === "sessionQuestionReply") {
      rows.push(["session_question_replies", {
        reply_id: text(payload.replyId || localId("session-reply")),
        question_id: text(payload.questionId),
        session_id: text(payload.sessionId),
        message: text(payload.message),
        display_name: displayName(payload.name),
        ...userFields(payload),
        status: "Visible",
        posted_at: timestamp(payload.postedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    } else if (type === "emailSchedule") {
      rows.push(["schedule_email_requests", {
        ...userFields(payload),
        recipient_email: text(payload.recipientEmail || payload.email),
        schedule_items: jsonSafe(payload.sessions || payload.schedule || []),
        requested_at: timestamp(payload.requestedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    } else if (type === "emailSessionNotes") {
      rows.push(["session_notes_email_requests", {
        ...userFields(payload),
        recipient_email: text(payload.recipientEmail || payload.email),
        session_id: text(payload.sessionId),
        session_title: text(payload.sessionTitle),
        notes: text(payload.notes),
        requested_at: timestamp(payload.requestedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    } else if (type === "scheduleSync") {
      rows.push(["synced_schedules", {
        email: text(payload.email),
        schedule_items: jsonSafe({
          attending: payload.attending || [],
          watching: payload.watching || [],
          items: payload.items || payload.sessions || []
        }),
        synced_at: timestamp(payload.syncedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    }

    rows.push(["app_events", {
      event_type: type,
      email: text(payload.email),
      source: text(payload.source),
      page_url: text(payload.page),
      raw_payload: eventPayload(payload),
      created_at: new Date().toISOString()
    }]);

    return rows;
  }

  async function mirrorPayload(payload) {
    const config = getConfig();
    if (!isEnabled() || !config.mirrorWrites) return;
    const workingPayload = { ...(payload || {}) };
    if (text(workingPayload.type) === "communityPost") {
      workingPayload.postId = text(workingPayload.postId || localId("post"));
      if (workingPayload.imageData && !workingPayload.imageUrl) {
        workingPayload.imageUrl = await uploadCommunityImage(workingPayload, workingPayload.postId);
      }
    }
    const rows = mapPayload(workingPayload);
    await Promise.all(rows.map(([table, row]) => insertRow(table, row)));
    if (text(payload?.type) === "drinkServed") {
      await patchRows("drink_redemptions", { redemption_code: `eq.${text(payload.code || payload.drinkCode)}` }, {
        status: "Served",
        served_at: timestamp(payload.servedAt, new Date().toISOString()),
        served_by: text(payload.servedBy)
      });
    }
  }

  async function loadAppAlerts() {
    if (!isEnabled() || !getConfig().readFromSupabase) return null;
    const rows = await selectRows("app_alerts", {
      select: "title,message,button_label,view,active,starts_at,ends_at,priority",
      active: "eq.true",
      order: "priority.asc,created_at.asc",
      limit: 4
    });
    return {
      alerts: rows.map((row) => ({
        label: row.button_label || "Alert",
        title: row.title || "",
        message: row.message || "",
        action: row.button_label || "Open",
        view: row.view || "my"
      }))
    };
  }

  async function loadDrinkStatus(code) {
    if (!isEnabled() || !getConfig().readFromSupabase || !code) return null;
    const rows = await selectRows("public_drink_redemptions", {
      select: "redemption_code,display_name,full_name,agency,issued_at,status,served_at,served_by,redeemed_at",
      redemption_code: `eq.${code}`,
      limit: 1
    });
    if (!rows.length) return { ticket: { found: false, code } };
    const ticket = rows[0];
    return {
      ticket: {
        found: true,
        code: ticket.redemption_code,
        displayName: ticket.display_name,
        name: ticket.full_name,
        agency: ticket.agency,
        email: "",
        issuedAt: ticket.issued_at || ticket.redeemed_at,
        status: ticket.status || "Issued",
        servedAt: ticket.served_at,
        servedBy: ticket.served_by
      }
    };
  }

  async function loadCommunityPosts() {
    if (!isEnabled() || !getConfig().readFromSupabase) return null;
    const [posts, replies] = await Promise.all([
      selectRows("public_community_posts", {
        select: "post_id,category,title,message,image_url,display_name,agency,share_email,posted_at,created_at",
        status: "neq.Hidden",
        order: "posted_at.desc",
        limit: 60
      }),
      selectRows("public_community_replies", {
        select: "post_id,message,display_name,agency,posted_at,created_at",
        status: "neq.Hidden",
        order: "posted_at.asc",
        limit: 500
      })
    ]);
    const repliesByPost = replies.reduce((grouped, reply) => {
      if (!grouped[reply.post_id]) grouped[reply.post_id] = [];
      grouped[reply.post_id].push({
        message: reply.message,
        displayName: reply.display_name || "NEHA attendee",
        agency: reply.agency || "",
        postedAt: reply.posted_at || reply.created_at
      });
      return grouped;
    }, {});
    return {
      posts: posts.map((post) => ({
        id: post.post_id,
        category: normalizeCategory(post.category),
        title: post.title,
        message: post.message,
        imageUrl: post.image_url,
        displayName: post.display_name || "NEHA attendee",
        agency: post.agency || "",
        email: "",
        shareEmail: Boolean(post.share_email),
        postedAt: post.posted_at || post.created_at,
        replies: repliesByPost[post.post_id] || []
      }))
    };
  }

  async function loadSessionThread(sessionId) {
    if (!isEnabled() || !getConfig().readFromSupabase || !sessionId) return null;
    const [questions, replies] = await Promise.all([
      selectRows("public_session_questions", {
        select: "question_id,session_id,title,message,display_name,agency,posted_at,created_at",
        session_id: `eq.${sessionId}`,
        status: "neq.Hidden",
        order: "posted_at.desc",
        limit: 30
      }),
      selectRows("public_session_question_replies", {
        select: "question_id,session_id,message,display_name,agency,posted_at,created_at",
        session_id: `eq.${sessionId}`,
        status: "neq.Hidden",
        order: "posted_at.asc",
        limit: 500
      })
    ]);
    const repliesByQuestion = replies.reduce((grouped, reply) => {
      if (!grouped[reply.question_id]) grouped[reply.question_id] = [];
      grouped[reply.question_id].push({
        message: reply.message,
        displayName: reply.display_name || "NEHA attendee",
        agency: reply.agency || "",
        postedAt: reply.posted_at || reply.created_at
      });
      return grouped;
    }, {});
    return {
      thread: {
        sessionId,
        questions: questions.map((question) => ({
          id: question.question_id,
          title: question.title,
          message: question.message,
          displayName: question.display_name || "NEHA attendee",
          agency: question.agency || "",
          postedAt: question.posted_at || question.created_at,
          replies: repliesByQuestion[question.question_id] || []
        }))
      }
    };
  }

  async function loadSessionPresentations() {
    if (!isEnabled() || !getConfig().readFromSupabase) return null;
    const rows = await selectRows("session_presentations", {
      select: "session_id,title,speaker,url",
      active: "eq.true",
      order: "created_at.asc",
      limit: 500
    });
    return {
      presentations: rows.reduce((grouped, item) => {
        if (!grouped[item.session_id]) grouped[item.session_id] = [];
        grouped[item.session_id].push({
          title: item.title || "Session presentation",
          speaker: item.speaker || "",
          url: item.url
        });
        return grouped;
      }, {})
    };
  }

  async function loadTriviaLeaderboard(boardId = "food") {
    if (!isEnabled() || !getConfig().readFromSupabase) return null;
    const rows = await selectRows("public_trivia_scores", {
      select: "display_name,agency,score,total,achievement,hints_used,board_id,board_name,completed_at,created_at",
      board_id: `eq.${boardId}`,
      order: "score.desc,hints_used.asc,completed_at.asc",
      limit: 10
    });
    return {
      leaders: rows.map((entry, index) => ({
        rank: index + 1,
        name: entry.display_name || "Mystery Player",
        agency: entry.agency || "",
        score: Number(entry.score || 0),
        total: Number(entry.total || 12),
        achievement: entry.achievement || "",
        hintsUsed: Number(entry.hints_used || 0),
        boardId: entry.board_id || boardId,
        boardName: entry.board_name || "Food Code"
      }))
    };
  }

  window.NEHA_SUPABASE_BACKEND = {
    isEnabled,
    mirrorPayload,
    loadAppAlerts,
    loadDrinkStatus,
    loadCommunityPosts,
    loadSessionThread,
    loadSessionPresentations,
    loadTriviaLeaderboard
  };
})();
