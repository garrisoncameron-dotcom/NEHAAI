const SHEET_ID = "1ya26Sqt2GlpUDspUcreXEhDySgYGIlUGcsApV6zDf5s";
const SHEET_NAME = "NEHA Leads";
const TRIVIA_SHEET_NAME = "Trivia Scores";
const DEMO_SHEET_NAME = "Demo Requests";

function doPost(e) {
  const payload = JSON.parse(e.postData.contents || "{}");
  if (payload.type === "triviaScore") return recordTriviaScore_(payload);
  if (payload.type === "demoRequest") return recordDemoRequest_(payload);
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
