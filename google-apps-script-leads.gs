const SHEET_ID = "1ya26Sqt2GlpUDspUcreXEhDySgYGIlUGcsApV6zDf5s";
const SHEET_NAME = "NEHA Leads";
const TRIVIA_SHEET_NAME = "Trivia Scores";
const DEMO_SHEET_NAME = "Demo Requests";
const ALERTS_SHEET_NAME = "App Alerts";
const DRINK_SHEET_NAME = "Drink Redemptions";

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  if (payload.type === "triviaScore") return recordTriviaScore_(payload);
  if (payload.type === "demoRequest") return recordDemoRequest_(payload);
  if (payload.type === "drinkRedemption") return recordDrinkRedemption_(payload);
  if (payload.type === "drinkServed") return markDrinkServed_(payload);
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
const SHEET_ID = "1ya26Sqt2GlpUDspUcreXEhDySgYGIlUGcsApV6zDf5s";
const SHEET_NAME = "NEHA Leads";
const TRIVIA_SHEET_NAME = "Trivia Scores";
const DEMO_SHEET_NAME = "Demo Requests";
const ALERTS_SHEET_NAME = "App Alerts";
const DRINK_SHEET_NAME = "Drink Redemptions";

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  if (payload.type === "triviaScore") return recordTriviaScore_(payload);
  if (payload.type === "demoRequest") return recordDemoRequest_(payload);
  if (payload.type === "drinkRedemption") return recordDrinkRedemption_(payload);
  if (payload.type === "drinkServed") return markDrinkServed_(payload);
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
      "HSCloud Suite",
      "Want a closer look?",
      "Book a quick HSCloud Suite demo and someone will reach out after NEHA.",
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
    "Open the NEHA guide anytime to play again, check the leaderboard, or book an HSCloud Suite demo.",
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
