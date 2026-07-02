const SHEET_ID = "1ya26Sqt2GlpUDspUcreXEhDySgYGIlUGcsApV6zDf5s";
const SHEET_NAME = "NEHA Leads";
const TRIVIA_SHEET_NAME = "Trivia Scores";
const DEMO_SHEET_NAME = "Demo Requests";
const ALERTS_SHEET_NAME = "App Alerts";
const DRINK_SHEET_NAME = "Drink Redemptions";
const COMMUNITY_SHEET_NAME = "Community Posts";
const COMMUNITY_REPLIES_SHEET_NAME = "Community Replies";
const SESSION_QUESTIONS_SHEET_NAME = "Session Questions";
const SESSION_REPLIES_SHEET_NAME = "Session Question Replies";
const SESSION_PRESENTATIONS_SHEET_NAME = "Session Presentations";
const SCHEDULE_EMAIL_SHEET_NAME = "Schedule Email Requests";
const SESSION_NOTES_EMAIL_SHEET_NAME = "Session Notes Email Requests";
const SCHEDULE_SYNC_SHEET_NAME = "Synced Schedules";
const DAILY_SCHEDULE_EMAIL_LOG_SHEET_NAME = "Daily Schedule Email Log";
const PODCAST_CHANNEL_URL = "https://www.youtube.com/@beyonddatamanagement";
const PODCAST_CACHE_KEY = "podcastEpisodes:v1";
const OUTBOUND_EMAIL_FROM = "NEHADailyBrief@conferenceguide.ai";
const OUTBOUND_EMAIL_NAME = "NEHA Daily Brief";
const HSGT_WEBSITE_URL = "https://hsgovtech.com";
const HSGT_DEMO_URL = "https://hsgovtech.com";
const HSGT_LOGO_URL = "https://raw.githubusercontent.com/garrisoncameron-dotcom/NEHAAI/main/assets/hs-govtech-email-logo.png";
const HSGT_MARK_URL = "https://raw.githubusercontent.com/garrisoncameron-dotcom/NEHAAI/main/assets/hs-govtech-logo.png";

function doPost(e) {
  if (!e || !e.postData) return jsonOutput_({ ok: true, authorization: authorizeScriptAccess() });
  const payload = JSON.parse(e.postData.contents || "{}");
  if (payload.type === "triviaScore") return recordTriviaScore_(payload);
  if (payload.type === "demoRequest") return recordDemoRequest_(payload);
  if (payload.type === "drinkRedemption") return recordDrinkRedemption_(payload);
  if (payload.type === "drinkServed") return markDrinkServed_(payload);
  if (payload.type === "communityPost") return recordCommunityPost_(payload);
  if (payload.type === "communityReply") return recordCommunityReply_(payload);
  if (payload.type === "sessionQuestion") return recordSessionQuestion_(payload);
  if (payload.type === "sessionQuestionReply") return recordSessionQuestionReply_(payload);
  if (payload.type === "emailSchedule") return recordScheduleEmail_(payload);
  if (payload.type === "emailSessionNotes") return recordSessionNotesEmail_(payload);
  if (payload.type === "scheduleSync") return recordScheduleSync_(payload);
  return recordLead_(payload);
}

function doGet(e) {
  const params = e.parameter || {};
  if (params.action === "alerts") {
    return jsonOutput_({ ok: true, alerts: getActiveAlerts_() }, params.callback);
  }
  if (params.action === "leaderboard") {
    return jsonOutput_({ ok: true, leaders: getTriviaLeaderboard_(params.boardId || "food") }, params.callback);
  }
  if (params.action === "drinkStatus") {
    return jsonOutput_({ ok: true, ticket: getDrinkTicket_(params.code || "") }, params.callback);
  }
  if (params.action === "communityPosts") {
    return jsonOutput_({ ok: true, posts: getCommunityPosts_() }, params.callback);
  }
  if (params.action === "sessionThread") {
    return jsonOutput_({ ok: true, thread: getSessionThread_(params.sessionId || "") }, params.callback);
  }
  if (params.action === "sessionPresentations") {
    return jsonOutput_({ ok: true, presentations: getSessionPresentations_() }, params.callback);
  }
  if (params.action === "podcastEpisodes") {
    return jsonOutput_({ ok: true, episodes: getPodcastEpisodes_() }, params.callback);
  }
  return jsonOutput_({ ok: true }, params.callback);
}

function jsonOutput_(payload, callback) {
  const output = JSON.stringify(payload);
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${output});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

function recordLead_(payload) {
  const sheet = getLeadSheet_();
  sheet.appendRow([
    new Date(),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    payload.capturedAt || "",
    payload.source || "",
    payload.page || "",
    payload.userAgent || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function recordTriviaScore_(payload) {
  const sheet = getTriviaSheet_();
  const score = Number(payload.score || 0);
  const total = Number(payload.total || 12);
  const hintsUsed = Number(payload.hintsUsed || 0);
  sheet.appendRow([
    new Date(),
    displayName_(payload.name || ""),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    score,
    total,
    payload.achievement || "",
    hintsUsed,
    payload.completedAt || "",
    payload.source || "",
    payload.page || "",
    payload.boardId || "food",
    payload.boardName || "Food Code"
  ]);
  sendTriviaScoreEmail_(payload, score, total, hintsUsed);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function recordDemoRequest_(payload) {
  const sheet = getDemoSheet_();
  sheet.appendRow([
    new Date(),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    payload.phone || "",
    payload.state || "",
    payload.notes || "",
    payload.requestedAt || "",
    payload.source || "",
    payload.page || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function recordDrinkRedemption_(payload) {
  const sheet = getDrinkSheet_();
  const code = String(payload.code || "").trim();
  if (!code) return jsonOutput_({ ok: false, error: "Missing code" });

  const row = findDrinkRow_(sheet, code);
  if (row > 1) return jsonOutput_({ ok: true, duplicate: true });

  sheet.appendRow([
    new Date(),
    code,
    displayName_(payload.name || ""),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    payload.issuedAt || "",
    "Issued",
    "",
    "",
    payload.source || "",
    payload.page || "",
    payload.userAgent || ""
  ]);

  return jsonOutput_({ ok: true, code });
}

function markDrinkServed_(payload) {
  const sheet = getDrinkSheet_();
  const code = String(payload.code || "").trim();
  if (!code) return jsonOutput_({ ok: false, error: "Missing code" });
  const row = findDrinkRow_(sheet, code);
  if (row <= 1) return jsonOutput_({ ok: false, error: "Not found" });

  const currentStatus = String(sheet.getRange(row, 8).getValue() || "");
  if (currentStatus !== "Served") {
    sheet.getRange(row, 8, 1, 3).setValues([[
      "Served",
      payload.servedAt || new Date(),
      payload.servedBy || ""
    ]]);
  }

  return jsonOutput_({ ok: true, ticket: getDrinkTicket_(code) });
}

function recordCommunityPost_(payload) {
  const sheet = getCommunitySheet_();
  const title = trimText_(payload.title, 90);
  const message = trimText_(payload.message, 700);
  if (!title || !message) return jsonOutput_({ ok: false, error: "Missing title or message" });
  const postId = communityPostId_();
  const imageResult = saveCommunityImage_(payload, postId);
  const imageUrl = imageResult.url || safeHttpsUrl_(payload.imageUrl || "");
  const imageStatus = imageResult.error ? `Image upload failed: ${imageResult.error}` : "";

  sheet.appendRow([
    new Date(),
    normalizeCommunityCategory_(payload.category),
    title,
    message,
    imageUrl,
    displayName_(payload.name || ""),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    String(payload.shareEmail || "").toLowerCase() === "yes" ? "Yes" : "No",
    payload.postedAt || "",
    payload.source || "",
    payload.page || "",
    "Visible",
    postId,
    imageStatus
  ]);
  sheet.autoResizeColumns(1, 16);

  return jsonOutput_({ ok: true, postId, imageUrl, imageStatus });
}

function recordCommunityReply_(payload) {
  const sheet = getCommunityReplySheet_();
  const postId = trimText_(payload.postId, 80);
  const message = trimText_(payload.message, 500);
  if (!postId || !message) return jsonOutput_({ ok: false, error: "Missing post or message" });

  sheet.appendRow([
    new Date(),
    postId,
    message,
    displayName_(payload.name || ""),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    payload.postedAt || "",
    payload.source || "",
    payload.page || "",
    "Visible"
  ]);
  sheet.autoResizeColumns(1, 11);

  return jsonOutput_({ ok: true });
}

function recordSessionQuestion_(payload) {
  const sheet = getSessionQuestionSheet_();
  const sessionId = trimText_(payload.sessionId, 120);
  const title = trimText_(payload.title, 100);
  const message = trimText_(payload.message, 700);
  if (!sessionId || !title || !message) return jsonOutput_({ ok: false, error: "Missing session question fields" });
  const questionId = `question-${Utilities.getUuid()}`;

  sheet.appendRow([
    new Date(),
    questionId,
    sessionId,
    payload.sessionTitle || "",
    payload.sessionTime || "",
    title,
    message,
    displayName_(payload.name || ""),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    payload.postedAt || "",
    payload.source || "",
    payload.page || "",
    "Visible"
  ]);
  sheet.autoResizeColumns(1, 15);

  return jsonOutput_({ ok: true, questionId });
}

function recordSessionQuestionReply_(payload) {
  const sheet = getSessionReplySheet_();
  const sessionId = trimText_(payload.sessionId, 120);
  const questionId = trimText_(payload.questionId, 120);
  const message = trimText_(payload.message, 500);
  if (!sessionId || !questionId || !message) return jsonOutput_({ ok: false, error: "Missing session reply fields" });

  sheet.appendRow([
    new Date(),
    questionId,
    sessionId,
    message,
    displayName_(payload.name || ""),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    payload.postedAt || "",
    payload.source || "",
    payload.page || "",
    "Visible"
  ]);
  sheet.autoResizeColumns(1, 12);

  return jsonOutput_({ ok: true });
}

function recordScheduleEmail_(payload) {
  const sheet = getScheduleEmailSheet_();
  const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
  const mailStatus = sendScheduleEmail_(payload, sessions);
  sheet.appendRow([
    new Date(),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    sessions.length,
    JSON.stringify(sessions),
    payload.requestedAt || "",
    payload.source || "",
    payload.page || "",
    mailStatus
  ]);
  sheet.autoResizeColumns(1, 10);
  return jsonOutput_({ ok: true, mailStatus });
}

function recordSessionNotesEmail_(payload) {
  const sheet = getSessionNotesEmailSheet_();
  const session = payload.session && typeof payload.session === "object" ? payload.session : {};
  const notes = String(payload.notes || "").trim();
  const recipientEmail = String(payload.recipientEmail || payload.email || "").trim();
  const mailStatus = sendSessionNotesEmail_(payload, session, notes, recipientEmail);

  sheet.appendRow([
    new Date(),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    recipientEmail,
    session.id || "",
    session.title || "",
    session.date || "",
    session.time || "",
    session.location || "",
    notes,
    payload.requestedAt || "",
    payload.source || "",
    payload.page || "",
    mailStatus
  ]);
  sheet.autoResizeColumns(1, 15);
  return jsonOutput_({ ok: true, mailStatus });
}

function recordScheduleSync_(payload) {
  const sheet = getScheduleSyncSheet_();
  const attending = Array.isArray(payload.attending) ? payload.attending : [];
  const watching = Array.isArray(payload.watching) ? payload.watching : [];
  sheet.appendRow([
    new Date(),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    attending.length,
    watching.length,
    JSON.stringify(attending),
    JSON.stringify(watching),
    payload.syncedAt || "",
    payload.source || "",
    payload.page || ""
  ]);
  sheet.autoResizeColumns(1, 11);
  return jsonOutput_({ ok: true });
}

function getLeadSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Name",
      "Agency",
      "Email",
      "Captured At",
      "Source",
      "Page",
      "User Agent"
    ]);
  }

  return sheet;
}

function getDemoSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(DEMO_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(DEMO_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Name",
      "Agency",
      "Email",
      "Phone",
      "State",
      "Notes",
      "Requested At",
      "Source",
      "Page"
    ]);
  }

  return sheet;
}

function getTriviaSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(TRIVIA_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(TRIVIA_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Display Name",
      "Full Name",
      "Agency",
      "Email",
      "Score",
      "Total",
      "Achievement",
      "Hints Used",
      "Completed At",
      "Source",
      "Page",
      "Board ID",
      "Board Name"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 14);
  } else if (sheet.getLastColumn() < 14) {
    sheet.getRange(1, 13, 1, 2).setValues([["Board ID", "Board Name"]]);
  }

  return sheet;
}

function getDrinkSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(DRINK_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(DRINK_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Code",
      "Display Name",
      "Full Name",
      "Agency",
      "Email",
      "Issued At",
      "Status",
      "Served At",
      "Served By",
      "Source",
      "Page",
      "User Agent"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 13);
  }

  return sheet;
}

function getCommunitySheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(COMMUNITY_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(COMMUNITY_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Category",
      "Title",
      "Message",
      "Image URL",
      "Display Name",
      "Full Name",
      "Agency",
      "Email",
      "Share Email",
      "Posted At",
      "Source",
      "Page",
      "Status",
      "Post ID",
      "Image Status"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 16);
  } else if (sheet.getLastColumn() < 16) {
    if (sheet.getLastColumn() < 15) sheet.getRange(1, 15).setValue("Post ID");
    sheet.getRange(1, 16).setValue("Image Status");
    sheet.autoResizeColumns(1, 16);
  }

  return sheet;
}

function getCommunityReplySheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(COMMUNITY_REPLIES_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(COMMUNITY_REPLIES_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Post ID",
      "Message",
      "Display Name",
      "Full Name",
      "Agency",
      "Email",
      "Posted At",
      "Source",
      "Page",
      "Status"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 11);
  }

  return sheet;
}

function getSessionQuestionSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SESSION_QUESTIONS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SESSION_QUESTIONS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Question ID",
      "Session ID",
      "Session Title",
      "Session Time",
      "Title",
      "Message",
      "Display Name",
      "Full Name",
      "Agency",
      "Email",
      "Posted At",
      "Source",
      "Page",
      "Status"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 15);
  }

  return sheet;
}

function getSessionReplySheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SESSION_REPLIES_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SESSION_REPLIES_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Question ID",
      "Session ID",
      "Message",
      "Display Name",
      "Full Name",
      "Agency",
      "Email",
      "Posted At",
      "Source",
      "Page",
      "Status"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 12);
  }

  return sheet;
}

function getSessionPresentationSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SESSION_PRESENTATIONS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SESSION_PRESENTATIONS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Session ID",
      "Session Title",
      "Presentation Title",
      "Speaker",
      "URL",
      "Status"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 6);
  }

  return sheet;
}

function getScheduleEmailSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SCHEDULE_EMAIL_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SCHEDULE_EMAIL_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Name",
      "Agency",
      "Email",
      "Session Count",
      "Sessions JSON",
      "Requested At",
      "Source",
      "Page",
      "Mail Status"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 10);
  } else if (sheet.getLastColumn() < 10) {
    sheet.getRange(1, 10).setValue("Mail Status");
    sheet.autoResizeColumns(1, 10);
  }

  return sheet;
}

function getSessionNotesEmailSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SESSION_NOTES_EMAIL_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SESSION_NOTES_EMAIL_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Name",
      "Agency",
      "User Email",
      "Recipient Email",
      "Session ID",
      "Session Title",
      "Session Date",
      "Session Time",
      "Session Location",
      "Notes",
      "Requested At",
      "Source",
      "Page",
      "Mail Status"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 15);
  }

  return sheet;
}

function getScheduleSyncSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SCHEDULE_SYNC_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SCHEDULE_SYNC_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Received At",
      "Name",
      "Agency",
      "Email",
      "Attending Count",
      "Watching Count",
      "Attending JSON",
      "Watching JSON",
      "Synced At",
      "Source",
      "Page"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 11);
  }

  return sheet;
}

function getDailyScheduleEmailLogSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(DAILY_SCHEDULE_EMAIL_LOG_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(DAILY_SCHEDULE_EMAIL_LOG_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Sent At",
      "Schedule Date",
      "Name",
      "Agency",
      "Email",
      "Session Count",
      "Mail Status"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 7);
  }

  return sheet;
}

function getAlertsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(ALERTS_SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(ALERTS_SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Active",
      "Label",
      "Title",
      "Message",
      "Button Text",
      "Destination",
      "Starts At",
      "Ends At",
      "Sort Order"
    ]);
    sheet.appendRow([
      "Yes",
      "Trivia Prize",
      "Perfect scores win prizes",
      "Finish 12 for 12 in EH Trivia, then visit the HS GovTech booth for a special prize.",
      "Play Trivia",
      "trivia",
      "",
      "",
      1
    ]);
    sheet.appendRow([
      "Yes",
      "HS CloudSuite",
      "Want a closer look?",
      "Book a quick HS CloudSuite demo and someone will reach out after the conference.",
      "Book Demo",
      "demo",
      "",
      "",
      2
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 9);
  }

  return sheet;
}

function getActiveAlerts_() {
  const sheet = getAlertsSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  const now = new Date();
  const allowedDestinations = {
    schedule: true,
    my: true,
    ai: true,
    kc: true,
    venue: true,
    podcast: true,
    trivia: true,
    demo: true,
    drink: true
  };
  return rows
    .map((row) => ({
      active: String(row[0] || "").trim().toLowerCase(),
      label: String(row[1] || "").trim(),
      title: String(row[2] || "").trim(),
      message: String(row[3] || "").trim(),
      action: String(row[4] || "").trim(),
      view: String(row[5] || "").trim().toLowerCase(),
      startsAt: row[6],
      endsAt: row[7],
      sortOrder: Number(row[8] || 999)
    }))
    .filter((alert) => ["yes", "true", "1", "active"].includes(alert.active))
    .filter((alert) => alert.title && alert.message)
    .filter((alert) => !alert.view || allowedDestinations[alert.view])
    .filter((alert) => isInAlertWindow_(alert.startsAt, alert.endsAt, now))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
    .slice(0, 4)
    .map((alert) => ({
      label: alert.label || "Alert",
      title: alert.title,
      message: alert.message,
      action: alert.action || "Open",
      view: alert.view || "schedule"
    }));
}

function isInAlertWindow_(startsAt, endsAt, now) {
  const start = parseSheetDate_(startsAt);
  const end = parseSheetDate_(endsAt);
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

function parseSheetDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === "[object Date]" && !isNaN(value)) return value;
  const parsed = new Date(value);
  return isNaN(parsed) ? null : parsed;
}

function getTriviaLeaderboard_(boardId) {
  const sheet = getTriviaSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, Math.max(14, sheet.getLastColumn())).getValues();
  const requestedBoard = String(boardId || "food").trim() || "food";
  return rows
    .map((row) => ({
      receivedAt: row[0],
      name: row[1] || "Mystery Player",
      agency: row[3] || "",
      score: Number(row[5] || 0),
      total: Number(row[6] || 12),
      achievement: row[7] || "",
      hintsUsed: Number(row[8] || 0),
      boardId: row[12] || "food",
      boardName: row[13] || "Food Code"
    }))
    .filter((entry) => entry.boardId === requestedBoard)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
      return new Date(a.receivedAt) - new Date(b.receivedAt);
    })
    .slice(0, 10)
    .map((entry, index) => ({
      rank: index + 1,
      name: entry.name,
      agency: entry.agency,
      score: entry.score,
      total: entry.total,
      achievement: entry.achievement,
      hintsUsed: entry.hintsUsed,
      boardId: entry.boardId,
      boardName: entry.boardName
    }));
}

function getCommunityPosts_() {
  const sheet = getCommunitySheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const repliesByPost = getCommunityRepliesByPost_();
  const rows = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
  return rows
    .map((row, index) => {
      const rowNumber = index + 2;
      let postId = String(row[14] || "").trim();
      if (!postId) {
        postId = `post-${rowNumber}`;
        sheet.getRange(rowNumber, 15).setValue(postId);
      }
      return {
        id: postId,
        receivedAt: row[0],
        category: normalizeCommunityCategory_(row[1]),
        title: String(row[2] || "").trim(),
        message: String(row[3] || "").trim(),
        imageUrl: safeHttpsUrl_(row[4] || ""),
        displayName: row[5] || "NEHA attendee",
        agency: row[7] || "",
        email: String(row[9] || "").toLowerCase() === "yes" ? String(row[8] || "").trim() : "",
        shareEmail: String(row[9] || "").toLowerCase() === "yes",
        postedAt: row[10] || row[0],
        status: String(row[13] || "Visible").trim().toLowerCase(),
        replies: repliesByPost[postId] || []
      };
    })
    .filter((post) => post.status !== "hidden" && post.title && post.message)
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
    .slice(0, 60)
    .map((post) => ({
      id: post.id,
      category: post.category,
      title: post.title,
      message: post.message,
      imageUrl: post.imageUrl,
      displayName: post.displayName,
      agency: post.agency,
      email: post.email,
      shareEmail: post.shareEmail,
      postedAt: post.postedAt,
      replies: post.replies
    }));
}

function getCommunityRepliesByPost_() {
  const sheet = getCommunityReplySheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};
  const rows = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  return rows
    .map((row) => ({
      receivedAt: row[0],
      postId: String(row[1] || "").trim(),
      message: String(row[2] || "").trim(),
      displayName: row[3] || "NEHA attendee",
      agency: row[5] || "",
      postedAt: row[7] || row[0],
      status: String(row[10] || "Visible").trim().toLowerCase()
    }))
    .filter((reply) => reply.status !== "hidden" && reply.postId && reply.message)
    .sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt))
    .reduce((grouped, reply) => {
      if (!grouped[reply.postId]) grouped[reply.postId] = [];
      grouped[reply.postId].push({
        message: reply.message,
        displayName: reply.displayName,
        agency: reply.agency,
        postedAt: reply.postedAt
      });
      return grouped;
    }, {});
}

function getSessionThread_(sessionId) {
  sessionId = trimText_(sessionId, 120);
  if (!sessionId) return { sessionId: "", questions: [] };
  const repliesByQuestion = getSessionRepliesByQuestion_(sessionId);
  const sheet = getSessionQuestionSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return { sessionId, questions: [] };
  const rows = sheet.getRange(2, 1, lastRow - 1, 15).getValues();
  const questions = rows
    .map((row) => ({
      receivedAt: row[0],
      id: String(row[1] || "").trim(),
      sessionId: String(row[2] || "").trim(),
      title: String(row[5] || "").trim(),
      message: String(row[6] || "").trim(),
      displayName: row[7] || "NEHA attendee",
      agency: row[9] || "",
      postedAt: row[11] || row[0],
      status: String(row[14] || "Visible").trim().toLowerCase()
    }))
    .filter((question) => question.status !== "hidden" && question.sessionId === sessionId && question.id && question.title && question.message)
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
    .slice(0, 30)
    .map((question) => ({
      id: question.id,
      title: question.title,
      message: question.message,
      displayName: question.displayName,
      agency: question.agency,
      postedAt: question.postedAt,
      replies: repliesByQuestion[question.id] || []
    }));
  return { sessionId, questions };
}

function getSessionRepliesByQuestion_(sessionId) {
  const sheet = getSessionReplySheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};
  const rows = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  return rows
    .map((row) => ({
      receivedAt: row[0],
      questionId: String(row[1] || "").trim(),
      sessionId: String(row[2] || "").trim(),
      message: String(row[3] || "").trim(),
      displayName: row[4] || "NEHA attendee",
      agency: row[6] || "",
      postedAt: row[8] || row[0],
      status: String(row[11] || "Visible").trim().toLowerCase()
    }))
    .filter((reply) => reply.status !== "hidden" && reply.sessionId === sessionId && reply.questionId && reply.message)
    .sort((a, b) => new Date(a.receivedAt) - new Date(b.receivedAt))
    .reduce((grouped, reply) => {
      if (!grouped[reply.questionId]) grouped[reply.questionId] = [];
      grouped[reply.questionId].push({
        message: reply.message,
        displayName: reply.displayName,
        agency: reply.agency,
        postedAt: reply.postedAt
      });
      return grouped;
    }, {});
}

function getSessionPresentations_() {
  const sheet = getSessionPresentationSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return {};
  const rows = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  return rows
    .map((row) => ({
      sessionId: String(row[0] || "").trim(),
      sessionTitle: String(row[1] || "").trim(),
      title: String(row[2] || "").trim(),
      speaker: String(row[3] || "").trim(),
      url: safeHttpsUrl_(row[4] || ""),
      status: String(row[5] || "Visible").trim().toLowerCase()
    }))
    .filter((item) => item.status !== "hidden" && item.sessionId && item.url)
    .reduce((grouped, item) => {
      if (!grouped[item.sessionId]) grouped[item.sessionId] = [];
      grouped[item.sessionId].push({
        title: item.title || item.sessionTitle || "Session presentation",
        speaker: item.speaker,
        url: item.url
      });
      return grouped;
    }, {});
}

function getPodcastEpisodes_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(PODCAST_CACHE_KEY);
  if (cached) {
    try {
      const episodes = JSON.parse(cached);
      if (Array.isArray(episodes) && episodes.length) return episodes;
    } catch (error) {
      // Ignore malformed cache and refresh below.
    }
  }

  const channelId = resolvePodcastChannelId_();
  if (!channelId) return [];
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`;
  const response = UrlFetchApp.fetch(feedUrl, { muteHttpExceptions: true, followRedirects: true });
  if (response.getResponseCode() >= 400) return [];

  const document = XmlService.parse(response.getContentText());
  const root = document.getRootElement();
  const atom = XmlService.getNamespace("http://www.w3.org/2005/Atom");
  const media = XmlService.getNamespace("media", "http://search.yahoo.com/mrss/");
  const yt = XmlService.getNamespace("yt", "http://www.youtube.com/xml/schemas/2015");
  const entries = root.getChildren("entry", atom);
  const timezone = Session.getScriptTimeZone() || "America/New_York";
  const episodes = entries.slice(0, 6).map((entry) => {
    const videoId = entry.getChildText("videoId", yt) || "";
    const title = entry.getChildText("title", atom) || "Beyond Data Management episode";
    const publishedRaw = entry.getChildText("published", atom) || "";
    const mediaGroup = entry.getChild("group", media);
    const thumbnail = mediaGroup?.getChild("thumbnail", media)?.getAttribute("url")?.getValue() || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : "");
    const description = trimText_(mediaGroup?.getChildText("description", media) || "", 220);
    return {
      id: videoId,
      title,
      url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : PODCAST_CHANNEL_URL,
      thumbnail,
      published: formatPodcastDate_(publishedRaw, timezone),
      description: description || "Recent Beyond Data Management conversation for environmental health professionals."
    };
  }).filter((episode) => episode.id && episode.title);

  if (episodes.length) cache.put(PODCAST_CACHE_KEY, JSON.stringify(episodes), 6 * 60 * 60);
  return episodes;
}

function resolvePodcastChannelId_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("podcastChannelId:v1");
  if (cached) return cached;

  const response = UrlFetchApp.fetch(PODCAST_CHANNEL_URL, { muteHttpExceptions: true, followRedirects: true });
  if (response.getResponseCode() >= 400) return "";
  const html = response.getContentText();
  const match = html.match(/"channelId":"(UC[^"]+)"/) || html.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
  const channelId = match ? match[1] : "";
  if (channelId) cache.put("podcastChannelId:v1", channelId, 24 * 60 * 60);
  return channelId;
}

function formatPodcastDate_(value, timezone) {
  const date = new Date(value);
  if (isNaN(date)) return "";
  return Utilities.formatDate(date, timezone, "MMM d, yyyy");
}

function getDrinkTicket_(code) {
  code = String(code || "").trim();
  if (!code) return { found: false };
  const sheet = getDrinkSheet_();
  const row = findDrinkRow_(sheet, code);
  if (row <= 1) return { found: false, code };
  const values = sheet.getRange(row, 1, 1, 13).getValues()[0];
  return {
    found: true,
    receivedAt: values[0],
    code: values[1],
    displayName: values[2],
    name: values[3],
    agency: values[4],
    email: values[5],
    issuedAt: values[6],
    status: values[7] || "Issued",
    servedAt: values[8],
    servedBy: values[9]
  };
}

function findDrinkRow_(sheet, code) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return -1;
  const codes = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  for (let index = 0; index < codes.length; index += 1) {
    if (String(codes[index][0] || "").trim() === code) return index + 2;
  }
  return -1;
}

function displayName_(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Mystery Player";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

function communityPostId_() {
  return `post-${Utilities.getUuid()}`;
}

function normalizeCommunityCategory_(category) {
  const value = String(category || "").trim().toLowerCase();
  const allowed = {
    "unique-problems": true,
    "eh-friends": true,
    "kc-images": true,
    "find-violation": true,
    "ask-community": true
  };
  return allowed[value] ? value : "ask-community";
}

function saveCommunityImage_(payload, postId) {
  const dataUrl = String(payload.imageData || "");
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return { url: "", error: "" };

  try {
    const mimeType = match[1] === "image/jpg" ? "image/jpeg" : match[1];
    const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
    const bytes = Utilities.base64Decode(match[2]);
    const safeName = String(payload.imageName || postId || "community-image")
      .replace(/[^a-z0-9._-]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "community-image";
    const blob = Utilities.newBlob(bytes, mimeType, `${postId}-${safeName}.${extension}`);
    const file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return { url: driveImageUrl_(file.getId()), error: "" };
  } catch (error) {
    console.error(`Community image upload failed for ${postId}: ${error}`);
    return { url: "", error: String(error).slice(0, 220) };
  }
}

function driveImageUrl_(fileId) {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1200`;
}

function authorizeScriptAccess() {
  const blob = Utilities.newBlob("authorization check", "text/plain", "neha-guide-drive-auth-check.txt");
  const file = DriveApp.createFile(blob);
  file.setTrashed(true);
  const email = Session.getActiveUser().getEmail() || "garrison.cameron@gmail.com";
  sendNehaEmail_(email, "NEHA Guide email authorization check", "Email sending is authorized for the NEHA Guide Apps Script.");
  return `Drive and email authorized: ${file.getId()}`;
}

function trimText_(value, maxLength) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function safeHttpsUrl_(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return /^https:\/\/[^\s]+$/i.test(text) ? text : "";
}

function sendTriviaScoreEmail_(payload, score, total, hintsUsed) {
  const email = String(payload.email || "").trim();
  if (!email) return;
  const achievement = payload.achievement || "EH Trivia Player";
  const boardName = payload.boardName || "Food Code";
  const body = [
    `Hi ${payload.name || "there"},`,
    "",
    `Thanks for playing the ${boardName} EH Trivia board at NEHA.`,
    "",
    `Your final score: ${score}/${total}`,
    `Achievement: ${achievement}`,
    `Hints used: ${hintsUsed}`,
    score === total ? "Perfect score! Visit the HS GovTech booth for a special prize." : "",
    "",
    "Open the NEHA guide anytime to play again, check the leaderboard, or book an HS CloudSuite demo.",
    "",
    "HS GovTech"
  ].join("\n");
  const htmlBody = brandedEmailHtml_({
    eyebrow: "EH Trivia",
    title: `${boardName} score: ${score}/${total}`,
    intro: `Thanks for playing the ${escapeHtml_(boardName)} EH Trivia board at NEHA.`,
    content: `
      ${summaryGridHtml_([
        ["Score", `${score}/${total}`],
        ["Achievement", achievement],
        ["Hints used", String(hintsUsed)]
      ])}
      ${score === total ? `<div style="margin:18px 0;padding:14px;border-radius:8px;background:#eaf7ef;color:#040048;font-weight:800;">Perfect score. Visit the HS GovTech booth for a special prize.</div>` : ""}
      <p style="margin:18px 0 0;color:#383748;line-height:1.5;">Open the NEHA guide anytime to play again, check the leaderboard, or book an HS CloudSuite demo.</p>
    `
  });

  try {
    sendNehaEmail_(email, `Your ${boardName} EH Trivia score: ${score}/${total}`, body, htmlBody);
  } catch (error) {
    console.error(`Trivia score email failed for ${email}: ${error}`);
  }
}

function sendScheduleEmail_(payload, sessions) {
  const email = String(payload.email || "").trim();
  if (!email) return "No email address";
  if (!sessions.length) return "No attending sessions";
  const lines = sessions.map((session, index) => [
    `${index + 1}. ${session.title || "Untitled session"}`,
    `   ${session.date || ""} ${session.time || ""}`,
    `   ${session.location || ""}${session.ce ? ` | CE: ${session.ce}` : ""}`
  ].join("\n"));
  const body = [
    `Hi ${payload.name || "there"},`,
    "",
    "Here is your current MyAEC attending schedule:",
    "",
    ...lines,
    "",
    "Open the NEHA guide to update your agenda, add notes, ask session questions, or browse all sessions.",
    "",
    "HS GovTech"
  ].join("\n");
  const htmlBody = brandedEmailHtml_({
    eyebrow: "MyAEC Schedule",
    title: "Your MyAEC Schedule",
    intro: `Hi ${escapeHtml_(payload.name || "there")}, here is your current attending schedule.`,
    content: `
      ${sessionsTableHtml_(sessions, true)}
      <p style="margin:18px 0 0;color:#383748;line-height:1.5;">Open the NEHA guide to update your agenda, add notes, ask session questions, or browse all sessions.</p>
    `
  });

  try {
    sendNehaEmail_(email, "Your MyAEC schedule", body, htmlBody);
    return `Sent to ${email}`;
  } catch (error) {
    console.error(`Schedule email failed for ${email}: ${error}`);
    return `Failed: ${String(error).slice(0, 220)}`;
  }
}

function sendSessionNotesEmail_(payload, session, notes, recipientEmail) {
  if (!recipientEmail) return "No recipient email";
  if (!notes) return "No notes";
  const sessionTitle = session.title || "NEHA session";
  const body = [
    `Hi ${payload.name || "there"},`,
    "",
    "Here are your private session notes from the NEHA guide.",
    "",
    sessionTitle,
    `${session.date || ""} ${session.time || ""}`.trim(),
    session.location ? `Location: ${session.location}` : "",
    session.ce ? `CE: ${session.ce}` : "",
    "",
    "Notes:",
    notes,
    "",
    "Open the NEHA guide to update your notes, view presentations, ask session questions, or manage your MyAEC agenda.",
    "",
    "HS GovTech"
  ].filter((line) => line !== "").join("\n");
  const htmlBody = brandedEmailHtml_({
    eyebrow: "Session Notes",
    title: `Your NEHA session notes`,
    intro: `Here are your private notes from ${escapeHtml_(sessionTitle)}.`,
    content: `
      ${summaryGridHtml_([
        ["Session", sessionTitle],
        ["Date", session.date || ""],
        ["Time", session.time || ""],
        ["Room", session.location || ""],
        ["CE", session.ce || ""]
      ].filter((item) => item[1]))}
      <div style="margin-top:18px;">
        <div style="font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#040048;font-weight:900;">Notes</div>
        <div style="margin-top:8px;padding:14px;border:1px solid #C7D2D8;border-radius:8px;background:#f8fbfc;color:#383748;line-height:1.55;white-space:pre-wrap;">${escapeHtml_(notes)}</div>
      </div>
      <p style="margin:18px 0 0;color:#383748;line-height:1.5;">Open the NEHA guide to update your notes, view presentations, ask session questions, or manage your MyAEC agenda.</p>
    `
  });

  try {
    sendNehaEmail_(recipientEmail, `Your NEHA session notes: ${sessionTitle}`, body, htmlBody);
    return `Sent to ${recipientEmail}`;
  } catch (error) {
    console.error(`Session notes email failed for ${recipientEmail}: ${error}`);
    return `Failed: ${String(error).slice(0, 220)}`;
  }
}

function installDailyScheduleEmailTrigger() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === "sendDailyScheduleEmails")
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger("sendDailyScheduleEmails")
    .timeBased()
    .inTimezone("America/Chicago")
    .everyDays(1)
    .atHour(6)
    .create();

  return "Daily schedule email trigger installed for 6 AM Central.";
}

function sendDailyScheduleEmails() {
  const scheduleDate = Utilities.formatDate(new Date(), "America/Chicago", "yyyy-MM-dd");
  return sendDailyScheduleEmailsForDate_(scheduleDate);
}

function sendDailyScheduleEmailsForDate_(scheduleDate) {
  const latestSchedules = getLatestSyncedSchedules_();
  const sentKeys = getDailyScheduleEmailSentKeys_();
  const logSheet = getDailyScheduleEmailLogSheet_();
  let sent = 0;
  let skipped = 0;

  latestSchedules.forEach((schedule) => {
    const todaySessions = schedule.attending
      .filter((session) => sessionDateKey_(session) === scheduleDate)
      .sort(compareSyncedSessions_);
    if (!schedule.email || !todaySessions.length) {
      skipped += 1;
      return;
    }

    const key = `${scheduleDate}|${schedule.email.toLowerCase()}`;
    if (sentKeys[key]) {
      skipped += 1;
      return;
    }

    const mailStatus = sendDailyScheduleEmail_(schedule, todaySessions, scheduleDate);
    logSheet.appendRow([
      new Date(),
      scheduleDate,
      schedule.name,
      schedule.agency,
      schedule.email,
      todaySessions.length,
      mailStatus
    ]);
    sentKeys[key] = true;
    sent += mailStatus.indexOf("Sent to ") === 0 ? 1 : 0;
  });

  logSheet.autoResizeColumns(1, 7);
  return `Daily schedule email run complete for ${scheduleDate}. Sent: ${sent}. Skipped: ${skipped}.`;
}

function getLatestSyncedSchedules_() {
  const sheet = getScheduleSyncSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const rows = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  const latestByEmail = {};
  rows.forEach((row) => {
    const email = String(row[3] || "").trim();
    if (!email) return;
    latestByEmail[email.toLowerCase()] = {
      name: row[1] || "",
      agency: row[2] || "",
      email,
      attending: parseJsonArray_(row[6]),
      watching: parseJsonArray_(row[7]),
      syncedAt: row[8] || ""
    };
  });

  return Object.keys(latestByEmail).map((key) => latestByEmail[key]);
}

function getDailyScheduleEmailSentKeys_() {
  const sheet = getDailyScheduleEmailLogSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return {};

  const rows = sheet.getRange(2, 2, lastRow - 1, 4).getValues();
  return rows.reduce((keys, row) => {
    const scheduleDate = String(row[0] || "").trim();
    const email = String(row[3] || "").trim().toLowerCase();
    if (scheduleDate && email) keys[`${scheduleDate}|${email}`] = true;
    return keys;
  }, {});
}

function sendDailyScheduleEmail_(schedule, sessions, scheduleDate) {
  const email = String(schedule.email || "").trim();
  if (!email) return "No email address";

  const formattedDate = formatScheduleDate_(scheduleDate);
  const lines = sessions.map((session, index) => [
    `${index + 1}. ${session.title || "Untitled session"}`,
    `   ${session.time || ""}`,
    `   ${session.location || ""}${session.ce ? ` | CE: ${session.ce}` : ""}`
  ].join("\n"));
  const body = [
    `Good morning ${schedule.name || "there"},`,
    "",
    `Here is your MyAEC agenda for ${formattedDate}:`,
    "",
    ...lines,
    "",
    "Open the NEHA guide to adjust your schedule, view presentations, add notes, or ask session questions.",
    "",
    "HS GovTech"
  ].join("\n");
  const htmlBody = brandedEmailHtml_({
    eyebrow: "Daily Brief",
    title: `Your NEHA agenda for ${formattedDate}`,
    intro: `Good morning ${escapeHtml_(schedule.name || "there")}. Here is your MyAEC agenda for today.`,
    content: `
      ${sessionsTableHtml_(sessions, false)}
      <p style="margin:18px 0 0;color:#383748;line-height:1.5;">Open the NEHA guide to adjust your schedule, view presentations, add notes, or ask session questions.</p>
    `
  });

  try {
    sendNehaEmail_(email, `Your NEHA agenda for ${formattedDate}`, body, htmlBody);
    return `Sent to ${email}`;
  } catch (error) {
    console.error(`Daily schedule email failed for ${email}: ${error}`);
    return `Failed: ${String(error).slice(0, 220)}`;
  }
}

function sendNehaEmail_(to, subject, body, htmlBody) {
  const effectiveEmail = String(Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail() || "").toLowerCase();
  const options = {
    name: OUTBOUND_EMAIL_NAME,
    replyTo: OUTBOUND_EMAIL_FROM
  };
  if (htmlBody) options.htmlBody = htmlBody;
  if (effectiveEmail !== OUTBOUND_EMAIL_FROM.toLowerCase()) options.from = OUTBOUND_EMAIL_FROM;
  GmailApp.sendEmail(to, subject, body, options);
}

function brandedEmailHtml_({ eyebrow, title, intro, content }) {
  return `
    <div style="margin:0;padding:0;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#1f1f2b;">
      <div style="max-width:760px;margin:0 auto;padding:38px 28px 42px;background:#ffffff;">
        <div style="padding:0 0 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="vertical-align:top;padding:0;">
                <div style="font-size:23px;line-height:1.25;color:#35B0ED;font-weight:400;">${escapeHtml_(eyebrow || "NEHA Guide")}</div>
              </td>
              <td style="vertical-align:top;text-align:right;padding:0 0 0 16px;width:78px;">
                <img src="${HSGT_MARK_URL}" alt="HS GovTech" width="58" height="58" style="display:inline-block;width:58px;height:58px;border:0;outline:none;text-decoration:none;">
              </td>
            </tr>
          </table>
          <h1 style="margin:24px 0 0;font-size:42px;line-height:1.08;color:#040048;font-weight:900;letter-spacing:0;">${escapeHtml_(title || "NEHA Guide")}</h1>
        </div>
        <div style="padding:0;">
          <p style="margin:0 0 28px;color:#1f1f2b;line-height:1.55;font-size:17px;">${intro || ""}</p>
          ${content || ""}
        </div>
        ${emailSignatureHtml_()}
      </div>
    </div>
  `;
}

function emailSignatureHtml_() {
  return `
    <div style="margin-top:44px;padding-top:6px;">
      <img src="${HSGT_LOGO_URL}" alt="HS GovTech" width="180" height="39" style="display:block;width:180px;max-width:70%;height:auto;border:0;outline:none;text-decoration:none;margin:0 0 24px;">
      <p style="margin:0 0 22px;color:#1f1f2b;font-size:17px;line-height:1.5;max-width:650px;">Regulatory work protects real people, which is why your mission deserves software built with empathy, trust, and respect. Our unified platform is purpose-built to empower your agency with the modern, reliable, and flexible tools needed to match the immense importance of your work.</p>
      <a href="${HSGT_DEMO_URL}" style="display:inline-block;background:#EA5353;color:#ffffff;text-decoration:none;border-radius:999px;padding:10px 18px;font-size:15px;line-height:1.2;font-weight:700;margin:0 0 26px;">Book a Demo of HS CloudSuite Today!</a>
      <p style="margin:0;color:#1f1f2b;font-size:16px;line-height:1.45;">Your long-term partner in protecting public health<br>
        <a href="mailto:sales@hscloudsuite.com" style="color:#040048;text-decoration:none;">sales@hscloudsuite.com</a><br>
        <a href="${HSGT_WEBSITE_URL}" style="color:#040048;text-decoration:none;">hsgovtech.com</a>
      </p>
    </div>
  `;
}

function sessionsTableHtml_(sessions, includeDate) {
  const dateHeader = includeDate ? `<th style="${emailThStyle_()}border-top-left-radius:10px;">Date</th>` : "";
  const firstHeaderRadius = includeDate ? "" : "border-top-left-radius:10px;";
  const rows = sessions.map((session) => `
    <tr>
      ${includeDate ? `<td style="${emailTdStyle_()}">${escapeHtml_(session.date || "")}</td>` : ""}
      <td style="${emailTdStyle_()}">${escapeHtml_(session.time || "")}</td>
      <td style="${emailTdStyle_()}"><strong style="color:#040048;font-weight:900;">${escapeHtml_(session.title || "Untitled session")}</strong></td>
      <td style="${emailTdStyle_()}">${escapeHtml_(session.location || "")}</td>
      <td style="${emailTdStyle_()}">${escapeHtml_(session.ce || "")}</td>
    </tr>
  `).join("");
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;border:1px solid #C7D2D8;border-radius:10px;overflow:hidden;margin:0 0 8px;">
      <thead>
        <tr style="background:#35B0ED;color:#ffffff;">
          ${dateHeader}
          <th style="${emailThStyle_()}${firstHeaderRadius}">Time</th>
          <th style="${emailThStyle_()}">Session</th>
          <th style="${emailThStyle_()}">Room</th>
          <th style="${emailThStyle_()}border-top-right-radius:10px;">CE</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function summaryGridHtml_(items) {
  const cells = items.map(([label, value]) => `
    <td style="width:${Math.floor(100 / Math.max(items.length, 1))}%;padding:14px;border:1px solid #C7D2D8;background:#ffffff;vertical-align:top;">
      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#35B0ED;font-weight:900;">${escapeHtml_(label)}</div>
      <div style="margin-top:5px;color:#040048;font-weight:900;font-size:16px;line-height:1.35;">${escapeHtml_(value)}</div>
    </td>
  `).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:0 0 8px;"><tr>${cells}</tr></table>`;
}

function emailThStyle_() {
  return "padding:12px 12px;border-right:1px solid #35B0ED;border-bottom:0;text-align:left;font-size:16px;text-transform:uppercase;letter-spacing:.02em;color:#ffffff;font-weight:900;";
}

function emailTdStyle_() {
  return "padding:17px 12px;border-top:1px solid #C7D2D8;border-right:1px solid #C7D2D8;text-align:left;vertical-align:top;color:#1f1f2b;font-size:16px;line-height:1.35;";
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseJsonArray_(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function sessionDateKey_(session) {
  return String(session.rawDate || "").trim() || displayDateToKey_(session.date || "");
}

function displayDateToKey_(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return Utilities.formatDate(date, "America/Chicago", "yyyy-MM-dd");
}

function compareSyncedSessions_(a, b) {
  return String(a.start || a.time || "").localeCompare(String(b.start || b.time || ""));
}

function formatScheduleDate_(scheduleDate) {
  const date = new Date(`${scheduleDate}T12:00:00-05:00`);
  return Utilities.formatDate(date, "America/Chicago", "EEEE, MMMM d");
}
