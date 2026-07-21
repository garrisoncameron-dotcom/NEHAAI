type AppPayload = Record<string, unknown>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_TOKEN = Deno.env.get("ADMIN_TOKEN") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "NEHADailyBrief@conferenceguide.ai";
const FROM_NAME = Deno.env.get("FROM_NAME") || "NEHA Daily Brief";
const HSGT_WEBSITE_URL = "https://hsgovtech.com";
const HSGT_LOGO_URL = "https://raw.githubusercontent.com/garrisoncameron-dotcom/NEHAAI/main/assets/hs-govtech-email-logo.png";
const HSGT_MARK_URL = "https://raw.githubusercontent.com/garrisoncameron-dotcom/NEHAAI/main/assets/hs-govtech-logo.png";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) throw new Error("Supabase service credentials are not configured.");
    if (request.method === "GET") {
      const url = new URL(request.url);
      if (url.searchParams.has("section")) return handleAdminGet(request);
      return json({ ok: true, service: "conference-guide-app-api" });
    }
    if (request.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);
    const payload = await request.json() as AppPayload;
    if (text(payload.action).startsWith("admin:")) return handleAdminPost(request, payload);
    const result = await handlePayload(payload);
    return json({ ok: true, ...result });
  } catch (error) {
    return json({ ok: false, error: errorMessage(error) }, 500);
  }
});

async function handlePayload(payload: AppPayload) {
  const type = text(payload.type || "lead");
  await insertRow("app_events", {
    event_type: type,
    email: text(payload.email),
    source: text(payload.source),
    page_url: text(payload.page),
    raw_payload: payload
  });

  if (type === "lead") return insertRow("lead_captures", leadRow(payload));
  if (type === "demoRequest") return insertRow("demo_requests", demoRow(payload));
  if (type === "triviaScore") return recordTriviaScore(payload);
  if (type === "drinkRedemption") return recordDrinkRedemption(payload);
  if (type === "drinkServed") return markDrinkServed(payload);
  if (type === "communityPost") return recordCommunityPost(payload);
  if (type === "communityReply") return insertRow("community_replies", communityReplyRow(payload));
  if (type === "sessionQuestion") return insertRow("session_questions", sessionQuestionRow(payload));
  if (type === "sessionQuestionReply") return insertRow("session_question_replies", sessionQuestionReplyRow(payload));
  if (type === "emailSchedule") return recordScheduleEmail(payload);
  if (type === "emailSessionNotes") return recordSessionNotesEmail(payload);
  if (type === "scheduleSync") return insertRow("synced_schedules", scheduleSyncRow(payload));
  return insertRow("lead_captures", leadRow(payload));
}

async function handleAdminGet(request: Request) {
  authenticateAdmin(request);
  const url = new URL(request.url);
  const section = url.searchParams.get("section") || "leads";
  const format = url.searchParams.get("format") || "json";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || "200"), 1), 1000);
  const rows = await rowsForAdminSection(section, limit);
  if (format === "csv") {
    return new Response(toCsv(rows), {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="conference-guide-${section}.csv"`
      }
    });
  }
  return json({ ok: true, section, rows, summary: await adminSummary() });
}

async function handleAdminPost(request: Request, payload: AppPayload) {
  authenticateAdmin(request);
  const action = text(payload.action);
  if (action === "admin:saveAlert") return saveAdminAlert(payload);
  if (action === "admin:setStatus") return setAdminStatus(payload);
  return json({ ok: false, error: "Unknown admin action" }, 400);
}

async function rowsForAdminSection(section: string, limit: number) {
  if (section === "community") return communityAdminRows(limit);
  if (section === "sessionQuestions") return sessionQuestionAdminRows(limit);
  const configs: Record<string, { table: string; select: string; order: string }> = {
    leads: { table: "lead_captures", select: "id,submitted_at,full_name,agency,email,source,page_url,created_at", order: "submitted_at.desc" },
    demos: { table: "demo_requests", select: "id,requested_at,full_name,agency,email,phone,state,notes,source,page_url,created_at", order: "requested_at.desc" },
    trivia: { table: "trivia_scores", select: "id,completed_at,board_id,board_name,full_name,display_name,agency,email,score,total,achievement,hints_used,round_id,created_at", order: "completed_at.desc" },
    drinks: { table: "drink_redemptions", select: "id,issued_at,redeemed_at,redemption_code,full_name,display_name,agency,email,status,served_at,served_by,created_at", order: "issued_at.desc" },
    emails: { table: "outbound_email_log", select: "id,created_at,email_type,recipient_email,subject,status,error_message,provider_message_id", order: "created_at.desc" },
    alerts: { table: "app_alerts", select: "id,created_at,title,message,button_label,view,active,priority,starts_at,ends_at", order: "priority.asc,created_at.desc" }
  };
  const config = configs[section] || configs.leads;
  return selectRows(config.table, query({ select: config.select, order: config.order, limit: String(limit) }));
}

async function communityAdminRows(limit: number) {
  const [posts, replies] = await Promise.all([
    selectRows("community_posts", query({
      select: "id,post_id,category,title,message,image_url,display_name,full_name,agency,email,status,share_email,posted_at,created_at",
      order: "posted_at.desc",
      limit: String(limit)
    })),
    selectRows("community_replies", query({
      select: "id,reply_id,post_id,message,display_name,full_name,agency,email,status,posted_at,created_at",
      order: "posted_at.desc",
      limit: String(limit)
    }))
  ]);
  return [
    ...posts.map((row) => ({ kind: "Post", ...row })),
    ...replies.map((row) => ({ kind: "Reply", category: "", title: `Reply to ${row.post_id || ""}`, image_url: "", share_email: false, ...row }))
  ].sort((a, b) => text(b.posted_at || b.created_at).localeCompare(text(a.posted_at || a.created_at))).slice(0, limit);
}

async function sessionQuestionAdminRows(limit: number) {
  const [questions, replies] = await Promise.all([
    selectRows("session_questions", query({
      select: "id,question_id,session_id,session_title,session_time,title,message,display_name,full_name,agency,email,status,posted_at,created_at",
      order: "posted_at.desc",
      limit: String(limit)
    })),
    selectRows("session_question_replies", query({
      select: "id,reply_id,question_id,session_id,message,display_name,full_name,agency,email,status,posted_at,created_at",
      order: "posted_at.desc",
      limit: String(limit)
    }))
  ]);
  return [
    ...questions.map((row) => ({ kind: "Question", ...row })),
    ...replies.map((row) => ({ kind: "Reply", session_title: "", session_time: "", title: `Reply to ${row.question_id || ""}`, ...row }))
  ].sort((a, b) => text(b.posted_at || b.created_at).localeCompare(text(a.posted_at || a.created_at))).slice(0, limit);
}

async function adminSummary() {
  const [leads, demos, trivia, drinks, emails] = await Promise.all([
    countRows("lead_captures"),
    countRows("demo_requests"),
    countRows("trivia_scores"),
    countRows("drink_redemptions"),
    countRows("outbound_email_log")
  ]);
  return { leads, demos, trivia, drinks, emails };
}

async function saveAdminAlert(payload: AppPayload) {
  const row = {
    title: text(payload.title),
    message: text(payload.message),
    button_label: text(payload.buttonLabel) || "Open",
    view: text(payload.view) || "my",
    priority: number(payload.priority),
    active: Boolean(payload.active)
  };
  if (!row.title || !row.message) return json({ ok: false, error: "Title and message are required." }, 400);
  const id = text(payload.id);
  if (id) {
    await patchRows("app_alerts", `id=eq.${encodeURIComponent(id)}`, row);
    return json({ ok: true, updated: id });
  }
  await insertRow("app_alerts", row);
  return json({ ok: true, inserted: "app_alerts" });
}

async function setAdminStatus(payload: AppPayload) {
  const table = text(payload.table);
  const id = text(payload.id);
  const status = text(payload.status) || "Hidden";
  const allowed = ["community_posts", "community_replies", "session_questions", "session_question_replies"];
  if (!allowed.includes(table) || !id) return json({ ok: false, error: "Invalid moderation target." }, 400);
  await patchRows(table, `id=eq.${encodeURIComponent(id)}`, { status });
  return json({ ok: true, table, id, status });
}

async function recordTriviaScore(payload: AppPayload) {
  const row = triviaRow(payload);
  await insertRow("trivia_scores", row);
  await sendTriviaEmail(payload, row);
  return { recorded: "triviaScore" };
}

async function recordDrinkRedemption(payload: AppPayload) {
  await insertRow("drink_redemptions", {
    ...userFields(payload),
    display_name: displayName(payload.name),
    redemption_code: text(payload.code || payload.drinkCode),
    redeemed_at: timestamp(payload.redeemedAt || payload.createdAt),
    issued_at: timestamp(payload.issuedAt),
    status: "Issued",
    source: text(payload.source),
    page_url: text(payload.page),
    user_agent: text(payload.userAgent)
  });
  return { recorded: "drinkRedemption" };
}

async function markDrinkServed(payload: AppPayload) {
  const code = text(payload.code || payload.drinkCode);
  await insertRow("drink_redemption_events", {
    redemption_code: code,
    event_type: "Served",
    served_by: text(payload.servedBy),
    raw_payload: payload,
    recorded_at: timestamp(payload.servedAt)
  });
  await patchRows("drink_redemptions", `redemption_code=eq.${encodeURIComponent(code)}`, {
    status: "Served",
    served_at: timestamp(payload.servedAt),
    served_by: text(payload.servedBy)
  });
  return { recorded: "drinkServed" };
}

async function recordCommunityPost(payload: AppPayload) {
  const postId = text(payload.postId) || localId("post");
  let imageUrl = text(payload.imageUrl);
  if (!imageUrl && text(payload.imageData)) {
    imageUrl = await uploadCommunityImage(payload, postId);
  }
  await insertRow("community_posts", {
    post_id: postId,
    category: normalizeCategory(payload.category),
    title: text(payload.title),
    message: text(payload.message),
    image_name: text(payload.imageName),
    image_mime: text(payload.imageMime),
    image_url: imageUrl,
    share_email: text(payload.shareEmail).toLowerCase() === "yes",
    display_name: displayName(payload.name),
    ...userFields(payload),
    status: "Visible",
    posted_at: timestamp(payload.postedAt),
    source: text(payload.source),
    page_url: text(payload.page)
  });
  return { recorded: "communityPost", postId, imageUrl };
}

async function recordScheduleEmail(payload: AppPayload) {
  const sessions = sessionsFromPayload(payload);
  await insertRow("schedule_email_requests", {
    ...userFields(payload),
    recipient_email: text(payload.recipientEmail || payload.email),
    schedule_items: sessions,
    source: text(payload.source),
    page_url: text(payload.page),
    requested_at: timestamp(payload.requestedAt)
  });
  const emailStatus = await sendScheduleEmail(payload, sessions);
  return { recorded: "emailSchedule", emailStatus };
}

async function recordSessionNotesEmail(payload: AppPayload) {
  const session = objectValue(payload.session);
  const notes = text(payload.notes);
  const recipientEmail = text(payload.recipientEmail || payload.email);
  await insertRow("session_notes_email_requests", {
    ...userFields(payload),
    recipient_email: recipientEmail,
    session_id: text(session.id || payload.sessionId),
    session_title: text(session.title || payload.sessionTitle),
    notes,
    source: text(payload.source),
    page_url: text(payload.page),
    requested_at: timestamp(payload.requestedAt)
  });
  const emailStatus = await sendNotesEmail(payload, session, notes, recipientEmail);
  return { recorded: "emailSessionNotes", emailStatus };
}

function leadRow(payload: AppPayload) {
  return { ...userFields(payload), source: text(payload.source), page_url: text(payload.page), submitted_at: timestamp(payload.capturedAt) };
}

function demoRow(payload: AppPayload) {
  return { ...userFields(payload), phone: text(payload.phone), state: text(payload.state), notes: text(payload.notes), source: text(payload.source), page_url: text(payload.page), requested_at: timestamp(payload.requestedAt) };
}

function triviaRow(payload: AppPayload) {
  return {
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
    completed_at: timestamp(payload.completedAt),
    source: text(payload.source),
    page_url: text(payload.page)
  };
}

function communityReplyRow(payload: AppPayload) {
  return { reply_id: text(payload.replyId) || localId("reply"), post_id: text(payload.postId), message: text(payload.message), display_name: displayName(payload.name), ...userFields(payload), status: "Visible", posted_at: timestamp(payload.postedAt), source: text(payload.source), page_url: text(payload.page) };
}

function sessionQuestionRow(payload: AppPayload) {
  return { question_id: text(payload.questionId) || localId("question"), session_id: text(payload.sessionId), session_title: text(payload.sessionTitle), session_time: text(payload.sessionTime), title: text(payload.title || payload.question), message: text(payload.message || payload.question), display_name: displayName(payload.name), ...userFields(payload), status: "Visible", posted_at: timestamp(payload.postedAt), source: text(payload.source), page_url: text(payload.page) };
}

function sessionQuestionReplyRow(payload: AppPayload) {
  return { reply_id: text(payload.replyId) || localId("reply"), question_id: text(payload.questionId), session_id: text(payload.sessionId), message: text(payload.message), display_name: displayName(payload.name), ...userFields(payload), status: "Visible", posted_at: timestamp(payload.postedAt), source: text(payload.source), page_url: text(payload.page) };
}

function scheduleSyncRow(payload: AppPayload) {
  return { email: text(payload.email), schedule_items: { attending: payload.attending || [], watching: payload.watching || [], items: payload.items || payload.sessions || [] }, source: text(payload.source), page_url: text(payload.page), synced_at: timestamp(payload.syncedAt) };
}

function userFields(payload: AppPayload) {
  return { full_name: text(payload.name), agency: text(payload.agency), email: text(payload.email).toLowerCase() };
}

async function insertRow(table: string, row: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: restHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify(row)
  });
  if (!response.ok) throw new Error(`Insert failed for ${table}: ${response.status} ${await response.text()}`);
  return { recorded: table };
}

async function patchRows(table: string, query: string, row: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    method: "PATCH",
    headers: restHeaders({ Prefer: "return=minimal" }),
    body: JSON.stringify(row)
  });
  if (!response.ok) throw new Error(`Update failed for ${table}: ${response.status} ${await response.text()}`);
}

async function selectRows(table: string, qs: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, { headers: restHeaders() });
  if (!response.ok) throw new Error(`Select failed for ${table}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function countRows(table: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
    headers: restHeaders({ Prefer: "count=exact" })
  });
  if (!response.ok) return 0;
  const range = response.headers.get("content-range") || "";
  return Number(range.split("/")[1] || 0);
}

function authenticateAdmin(request: Request) {
  const token = request.headers.get("x-admin-token") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) throw new Error("Admin access denied.");
}

function query(params: Record<string, string>) {
  return Object.entries(params).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const columns = [...rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>())];
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n");
}

function csvCell(value: unknown) {
  const raw = typeof value === "object" && value !== null ? JSON.stringify(value) : text(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

async function uploadCommunityImage(payload: AppPayload, postId: string) {
  const image = dataUrlToBytes(text(payload.imageData));
  if (!image) return "";
  const extension = image.mimeType.includes("png") ? "png" : image.mimeType.includes("webp") ? "webp" : "jpg";
  const path = `${postId}/${Date.now()}.${extension}`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/community-images/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY, "Content-Type": image.mimeType, "x-upsert": "false" },
    body: image.bytes
  });
  if (!response.ok) throw new Error(`Image upload failed: ${response.status} ${await response.text()}`);
  return `${SUPABASE_URL}/storage/v1/object/public/community-images/${path}`;
}

async function sendScheduleEmail(payload: AppPayload, sessions: unknown[]) {
  const to = text(payload.recipientEmail || payload.email);
  if (!to || !sessions.length) return "Skipped";
  return sendEmail("schedule", to, "Your MyAEC schedule", brandedEmailHtml({
    eyebrow: "MyAEC Schedule",
    title: "Your MyAEC Schedule",
    intro: `Hi ${escapeHtml(text(payload.name) || "there")}, here is your current attending schedule.`,
    content: `${sessionsTableHtml(sessions, true)}<p style="margin:18px 0 0;color:#383748;line-height:1.5;">Open the NEHA guide to update your agenda, add notes, ask session questions, or browse all sessions.</p>`
  }), payload);
}

async function sendNotesEmail(payload: AppPayload, session: Record<string, unknown>, notes: string, to: string) {
  if (!to || !notes) return "Skipped";
  const title = text(session.title || payload.sessionTitle || "NEHA session");
  return sendEmail("notes", to, `Your NEHA session notes: ${title}`, brandedEmailHtml({
    eyebrow: "Session Notes",
    title: "Your NEHA session notes",
    intro: `Here are your private notes from ${escapeHtml(title)}.`,
    content: `${summaryGridHtml([["Session", title], ["Date", text(session.date)], ["Time", text(session.time)], ["Room", text(session.location)], ["CE", text(session.ce)]].filter((item) => item[1]))}<div style="margin-top:18px;padding:14px;border:1px solid #C7D2D8;border-radius:8px;background:#f8fbfc;color:#383748;line-height:1.55;white-space:pre-wrap;">${escapeHtml(notes)}</div>`
  }), payload);
}

async function sendTriviaEmail(payload: AppPayload, row: Record<string, unknown>) {
  const to = text(payload.email);
  if (!to) return "Skipped";
  const score = number(row.score);
  const total = number(row.total) || 12;
  const boardName = text(row.board_name || "Food Code");
  return sendEmail("trivia", to, `Your ${boardName} EH Trivia score: ${score}/${total}`, brandedEmailHtml({
    eyebrow: "EH Trivia",
    title: `${boardName} score: ${score}/${total}`,
    intro: `Thanks for playing the ${escapeHtml(boardName)} EH Trivia board at NEHA.`,
    content: `${summaryGridHtml([["Score", `${score}/${total}`], ["Achievement", text(row.achievement)], ["Hints used", String(number(row.hints_used))]])}${score === total ? `<div style="margin:18px 0;padding:14px;border-radius:8px;background:#eaf7ef;color:#040048;font-weight:800;">Perfect score. Visit the HS GovTech booth for a special prize.</div>` : ""}`
  }), payload);
}

async function sendEmail(type: string, to: string, subject: string, html: string, payload: AppPayload) {
  if (!RESEND_API_KEY) {
    await insertRow("outbound_email_log", { email_type: type, recipient_email: to, subject, status: "Not configured", raw_payload: payload });
    return "Email provider not configured";
  }
  const body = { from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html };
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const result = await response.json().catch(() => ({}));
  await insertRow("outbound_email_log", { email_type: type, recipient_email: to, subject, status: response.ok ? "Sent" : "Failed", provider_message_id: result.id || "", error_message: response.ok ? "" : JSON.stringify(result), raw_payload: payload });
  if (!response.ok) throw new Error(`Email failed: ${response.status}`);
  return `Sent to ${to}`;
}

function brandedEmailHtml({ eyebrow, title, intro, content }: { eyebrow: string; title: string; intro: string; content: string }) {
  return `<div style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f1f2b;"><div style="max-width:760px;margin:0 auto;padding:38px 28px 42px;background:#ffffff;"><table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;"><tr><td><div style="font-size:23px;line-height:1.25;color:#35B0ED;font-weight:400;">${escapeHtml(eyebrow)}</div></td><td style="text-align:right;width:78px;"><img src="${HSGT_MARK_URL}" alt="HS GovTech" width="58" height="58" style="display:inline-block;width:58px;height:58px;border:0;"></td></tr></table><h1 style="margin:24px 0 28px;font-size:42px;line-height:1.08;color:#040048;font-weight:900;">${escapeHtml(title)}</h1><p style="margin:0 0 28px;color:#1f1f2b;line-height:1.55;font-size:17px;">${intro}</p>${content}${emailSignatureHtml()}</div></div>`;
}

function emailSignatureHtml() {
  return `<div style="margin-top:44px;padding-top:6px;"><img src="${HSGT_LOGO_URL}" alt="HS GovTech" width="180" style="display:block;width:180px;max-width:70%;height:auto;border:0;margin:0 0 24px;"><p style="margin:0 0 22px;color:#1f1f2b;font-size:17px;line-height:1.5;max-width:650px;">Regulatory work protects real people, which is why your mission deserves software built with empathy, trust, and respect. Our unified platform is purpose-built to empower your agency with modern, reliable, and flexible tools.</p><a href="${HSGT_WEBSITE_URL}" style="display:inline-block;background:#EA5353;color:#ffffff;text-decoration:none;border-radius:999px;padding:10px 18px;font-size:15px;line-height:1.2;font-weight:700;margin:0 0 26px;">Book a Demo of HS CloudSuite Today!</a><p style="margin:0;color:#1f1f2b;font-size:16px;line-height:1.45;">Your long-term partner in protecting public health<br><a href="mailto:sales@hscloudsuite.com" style="color:#040048;text-decoration:none;">sales@hscloudsuite.com</a><br><a href="${HSGT_WEBSITE_URL}" style="color:#040048;text-decoration:none;">hsgovtech.com</a></p></div>`;
}

function sessionsTableHtml(sessions: unknown[], includeDate: boolean) {
  const rows = sessions.map((item) => {
    const session = objectValue(item);
    return `<tr>${includeDate ? `<td style="${tdStyle()}">${escapeHtml(text(session.date))}</td>` : ""}<td style="${tdStyle()}">${escapeHtml(text(session.time))}</td><td style="${tdStyle()}"><strong style="color:#040048;font-weight:900;">${escapeHtml(text(session.title || "Untitled session"))}</strong></td><td style="${tdStyle()}">${escapeHtml(text(session.location))}</td><td style="${tdStyle()}">${escapeHtml(text(session.ce))}</td></tr>`;
  }).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #C7D2D8;border-radius:10px;overflow:hidden;margin:0 0 8px;"><thead><tr style="background:#35B0ED;color:#ffffff;">${includeDate ? `<th style="${thStyle()}">Date</th>` : ""}<th style="${thStyle()}">Time</th><th style="${thStyle()}">Session</th><th style="${thStyle()}">Room</th><th style="${thStyle()}">CE</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function summaryGridHtml(items: string[][]) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 8px;"><tr>${items.map(([label, value]) => `<td style="padding:14px;border:1px solid #C7D2D8;background:#ffffff;vertical-align:top;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#35B0ED;font-weight:900;">${escapeHtml(label)}</div><div style="margin-top:5px;color:#040048;font-weight:900;font-size:16px;line-height:1.35;">${escapeHtml(value)}</div></td>`).join("")}</tr></table>`;
}

function sessionsFromPayload(payload: AppPayload) {
  return Array.isArray(payload.sessions) ? payload.sessions : [];
}

function dataUrlToBytes(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], bytes: Uint8Array.from(atob(match[2]), (char) => char.charCodeAt(0)) };
}

function restHeaders(extra: Record<string, string> = {}) {
  return { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY, "Content-Type": "application/json", ...extra };
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function text(value: unknown) {
  return value == null ? "" : String(value);
}

function number(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function timestamp(value: unknown) {
  const parsed = new Date(text(value) || Date.now());
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function displayName(name: unknown) {
  const parts = text(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "NEHA attendee";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].slice(0, 1)}.`;
}

function normalizeCategory(category: unknown) {
  const value = text(category).trim().toLowerCase();
  if (value === "kc photos" || value === "kc-images") return "kc-images";
  if (value === "find the violation" || value === "find-violation") return "find-violation";
  if (value === "meet new eh friends" || value === "meet-friends") return "meet-friends";
  if (value === "unique problems" || value === "unique-problems") return "unique-problems";
  if (value === "ask the community" || value === "ask-community") return "ask-community";
  return value || "ask-community";
}

function localId(prefix: string) {
  return `${prefix}-${Date.now()}-${crypto.randomUUID()}`;
}

function escapeHtml(value: unknown) {
  return text(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function thStyle() {
  return "padding:12px 12px;border-right:1px solid #35B0ED;text-align:left;font-size:16px;text-transform:uppercase;color:#ffffff;font-weight:900;";
}

function tdStyle() {
  return "padding:17px 12px;border-top:1px solid #C7D2D8;border-right:1px solid #C7D2D8;text-align:left;vertical-align:top;color:#1f1f2b;font-size:16px;line-height:1.35;";
}
