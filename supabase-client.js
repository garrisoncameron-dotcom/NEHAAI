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
        redemption_code: text(payload.code || payload.drinkCode),
        redeemed_at: timestamp(payload.redeemedAt || payload.createdAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
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
      rows.push(["community_posts", {
        post_id: text(payload.postId || localId("post")),
        category: text(payload.category),
        title: text(payload.title),
        message: text(payload.message),
        image_name: text(payload.imageName),
        image_mime: text(payload.imageMime),
        image_url: text(payload.imageUrl),
        share_email: text(payload.shareEmail).toLowerCase() === "yes",
        ...userFields(payload),
        posted_at: timestamp(payload.postedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    } else if (type === "communityReply") {
      rows.push(["community_replies", {
        reply_id: text(payload.replyId || localId("reply")),
        post_id: text(payload.postId),
        message: text(payload.message),
        ...userFields(payload),
        posted_at: timestamp(payload.postedAt, new Date().toISOString()),
        source: text(payload.source),
        page_url: text(payload.page)
      }]);
    } else if (type === "sessionQuestion") {
      rows.push(["session_questions", {
        question_id: text(payload.questionId || localId("question")),
        session_id: text(payload.sessionId),
        session_title: text(payload.sessionTitle),
        question: text(payload.question),
        ...userFields(payload),
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
        ...userFields(payload),
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
        schedule_items: jsonSafe(payload.items || payload.sessions || []),
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
    const rows = mapPayload(payload || {});
    await Promise.all(rows.map(([table, row]) => insertRow(table, row)));
  }

  window.NEHA_SUPABASE_BACKEND = {
    isEnabled,
    mirrorPayload
  };
})();
