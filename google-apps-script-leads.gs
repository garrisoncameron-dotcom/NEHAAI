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

function doPost(e) {
  if (!e || !e.postData) return jsonOutput_({ ok: true, authorization: authorizeDriveAccess() });
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
  return recordLead_(payload);
}

function doGet(e) {
  const params = e.parameter || {};
  if (params.action === "alerts") {
    return jsonOutput_({ ok: true, alerts: getActiveAlerts_() }, params.callback);
  }
  if (params.action === "leaderboard") {
    return jsonOutput_({ ok: true, leaders: getTriviaLeaderboard_() }, params.callback);
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
    payload.page || ""
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
  sheet.appendRow([
    new Date(),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    sessions.length,
    JSON.stringify(sessions),
    payload.requestedAt || "",
    payload.source || "",
    payload.page || ""
  ]);
  sheet.autoResizeColumns(1, 9);
  sendScheduleEmail_(payload, sessions);
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
      "Page"
    ]);
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
      "Page"
    ]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, 9);
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
      "Book a quick HS CloudSuite demo and someone will reach out after NEHA.",
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

function getTriviaLeaderboard_() {
  const sheet = getTriviaSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, 12).getValues();
  return rows
    .map((row) => ({
      receivedAt: row[0],
      name: row[1] || "Mystery Player",
      agency: row[3] || "",
      score: Number(row[5] || 0),
      total: Number(row[6] || 12),
      achievement: row[7] || "",
      hintsUsed: Number(row[8] || 0)
    }))
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
      hintsUsed: entry.hintsUsed
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
    return { url: `https://drive.google.com/uc?export=view&id=${file.getId()}`, error: "" };
  } catch (error) {
    console.error(`Community image upload failed for ${postId}: ${error}`);
    return { url: "", error: String(error).slice(0, 220) };
  }
}

function authorizeDriveAccess() {
  const blob = Utilities.newBlob("authorization check", "text/plain", "neha-guide-drive-auth-check.txt");
  const file = DriveApp.createFile(blob);
  file.setTrashed(true);
  return `Drive write authorized: ${file.getId()}`;
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
  const body = [
    `Hi ${payload.name || "there"},`,
    "",
    `Thanks for playing the EH Trivia Game at NEHA.`,
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

  try {
    MailApp.sendEmail({
      to: email,
      subject: `Your EH Trivia score: ${score}/${total}`,
      body
    });
  } catch (error) {
    console.error(`Trivia score email failed for ${email}: ${error}`);
  }
}

function sendScheduleEmail_(payload, sessions) {
  const email = String(payload.email || "").trim();
  if (!email || !sessions.length) return;
  const lines = sessions.map((session, index) => [
    `${index + 1}. ${session.title || "Untitled session"}`,
    `   ${session.date || ""} ${session.time || ""}`,
    `   ${session.location || ""}${session.ce ? ` | CE: ${session.ce}` : ""}`
  ].join("\n"));
  const body = [
    `Hi ${payload.name || "there"},`,
    "",
    "Here is your current MyNEHA attending schedule:",
    "",
    ...lines,
    "",
    "Open the NEHA guide to update your agenda, add notes, ask session questions, or browse all sessions.",
    "",
    "HS GovTech"
  ].join("\n");

  try {
    MailApp.sendEmail({
      to: email,
      subject: "Your MyNEHA schedule",
      body
    });
  } catch (error) {
    console.error(`Schedule email failed for ${email}: ${error}`);
  }
}
