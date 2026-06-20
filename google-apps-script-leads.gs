const SHEET_ID = "1ya26Sqt2GlpUDspUcreXEhDySgYGIlUGcsApV6zDf5s";
const SHEET_NAME = "NEHA Leads";
const TRIVIA_SHEET_NAME = "Trivia Scores";

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  if (payload.type === "triviaScore") return recordTriviaScore_(payload);
  return recordLead_(payload);
}

function doGet(e) {
  const params = e.parameter || {};
  if (params.action === "leaderboard") {
    const output = JSON.stringify({ ok: true, leaders: getTriviaLeaderboard_() });
    if (params.callback) {
      return ContentService
        .createTextOutput(`${params.callback}(${output});`)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService
      .createTextOutput(output)
      .setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
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
  sheet.appendRow([
    new Date(),
    displayName_(payload.name || ""),
    payload.name || "",
    payload.agency || "",
    payload.email || "",
    Number(payload.score || 0),
    Number(payload.total || 12),
    payload.achievement || "",
    Number(payload.hintsUsed || 0),
    payload.completedAt || "",
    payload.source || "",
    payload.page || ""
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
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

function displayName_(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "Mystery Player";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}
