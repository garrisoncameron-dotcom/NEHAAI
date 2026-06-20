const state = {
  sessions: [],
  guide: null,
  day: "all",
  category: "all",
  status: "all",
  query: "",
  myDay: "",
  placeFilter: "all",
  venueMap: "exhibit",
  pendingConflict: null,
  installPrompt: null,
  trivia: {
    index: 0,
    score: 0,
    selected: null,
    answered: false,
    complete: false,
    streak: 0,
    hintsRemaining: 3,
    hidden: {},
    submitted: false,
    submitting: false,
    leaderboard: [],
    leaderboardLoading: false,
    leaderboardError: "",
    order: [],
    best: Number(localStorage.getItem("nehaTriviaBest") || 0)
  },
  drinkRedeemed: localStorage.getItem("nehaFreeDrinkRedeemed") === "true",
  lead: JSON.parse(localStorage.getItem("nehaLead") || "null"),
  saved: JSON.parse(localStorage.getItem("nehaSaved") || '{"watch":{},"attend":{}}')
};

const els = {
  leadGate: document.querySelector("#leadGate"),
  leadForm: document.querySelector("#leadForm"),
  leadName: document.querySelector("#leadName"),
  leadAgency: document.querySelector("#leadAgency"),
  leadEmail: document.querySelector("#leadEmail"),
  leadNote: document.querySelector("#leadNote"),
  title: document.querySelector("#viewTitle"),
  search: document.querySelector("#searchInput"),
  dayTabs: document.querySelector("#dayTabs"),
  category: document.querySelector("#categorySelect"),
  status: document.querySelector("#statusSelect"),
  metrics: document.querySelector("#metricsRow"),
  nowNext: document.querySelector("#nowNext"),
  sessionList: document.querySelector("#sessionList"),
  myList: document.querySelector("#myList"),
  mySummary: document.querySelector("#mySummary"),
  myDayTabs: document.querySelector("#myDayTabs"),
  myDailyGrid: document.querySelector("#myDailyGrid"),
  conflictBanner: document.querySelector("#conflictBanner"),
  aiForm: document.querySelector("#aiForm"),
  aiPrompt: document.querySelector("#aiPrompt"),
  aiResults: document.querySelector("#aiResults"),
  aiReasons: document.querySelector("#aiReasons"),
  placeFilter: document.querySelector("#placeFilter"),
  placeGrid: document.querySelector("#placeGrid"),
  kcSourceLinks: document.querySelector("#kcSourceLinks"),
  hotelTips: document.querySelector("#hotelTips"),
  venueMapTabs: document.querySelector("#venueMapTabs"),
  venueMapImage: document.querySelector("#venueMapImage"),
  venueMapCaption: document.querySelector("#venueMapCaption"),
  podcastGrid: document.querySelector("#podcastGrid"),
  triviaScore: document.querySelector("#triviaScore"),
  triviaProgressBar: document.querySelector("#triviaProgressBar"),
  triviaStage: document.querySelector("#triviaStage"),
  installAppButton: document.querySelector("#installAppButton"),
  freeDrinkButton: document.querySelector("#freeDrinkButton"),
  freeDrinkStatus: document.querySelector("#freeDrinkStatus"),
  watchCount: document.querySelector("#watchCount"),
  attendCount: document.querySelector("#attendCount")
};

const viewTitles = {
  schedule: "Conference Schedule",
  my: "MyNEHASchedule",
  ai: "AI Session Guide",
  kc: "Things To Do In Kansas City",
  venue: "Venue Navigator",
  podcast: "Beyond Data Management",
  trivia: "EH Trivia Game",
  drink: "FREE DRINK"
};

const podcastEpisodes = [
  {
    id: "ZVCYECYqdss",
    title: "A First Look at Wiley: AFDO's New AI - Ep38 Jason Brill",
    url: "https://www.youtube.com/watch?v=ZVCYECYqdss",
    embed: "https://www.youtube.com/embed/ZVCYECYqdss",
    published: "Jun 15, 2026",
    description: "AFDO's Jason Brill joins Beyond Data Management for a look at Wiley, a new AI tool for food safety and health regulators."
  },
  {
    id: "aK-9_umXkFk",
    title: "Steve Mandernach previews AFDO 26 and discusses AI, FDA Collaboration, and the Future of Food Safety",
    url: "https://www.youtube.com/watch?v=aK-9_umXkFk",
    embed: "https://www.youtube.com/embed/aK-9_umXkFk",
    published: "Jun 1, 2026",
    description: "Cameron Garrison and AFDO Executive Director Steve Mandernach discuss inspections, training, AI, FSMA, and the future of food safety."
  },
  {
    id: "cHmadBE2If0",
    title: "Traumatic Insemination: Bed Bugs Are Even Grosser Than You Imagined",
    url: "https://www.youtube.com/watch?v=cHmadBE2If0",
    embed: "https://www.youtube.com/embed/cHmadBE2If0",
    published: "Apr 21, 2026",
    description: "Dr. Aaron Ashbrook breaks down bed bug science and what environmental health professionals should know."
  },
  {
    id: "Y-_L57-e98g",
    title: "\"I Just Remembered I Have to Take This Call\" - Smart De-Escalation Tricks for Regulators",
    url: "https://www.youtube.com/watch?v=Y-_L57-e98g",
    embed: "https://www.youtube.com/embed/Y-_L57-e98g",
    published: "Apr 14, 2026",
    description: "Alicia Love shares practical de-escalation approaches for regulators in tense field situations."
  }
];

const triviaQuestions = [
  {
    section: "2-301.12",
    category: "Hands",
    question: "Food employees must clean their hands and exposed portions of arms for at least how long?",
    options: ["20 seconds", "10 seconds", "45 seconds", "Only until visibly clean"],
    answer: 0,
    explanation: "Section 2-301.12 sets a minimum 20-second handwashing procedure."
  },
  {
    section: "3-501.16",
    category: "Cold Holding",
    question: "Cold-held TCS food should generally be maintained at what temperature?",
    options: ["41°F or less", "45°F or less", "50°F or less", "32°F exactly"],
    answer: 0,
    explanation: "Cold holding for TCS food is generally 41°F or less."
  },
  {
    section: "3-501.16",
    category: "Hot Holding",
    question: "Hot-held TCS food should generally be maintained at what temperature?",
    options: ["135°F or above", "120°F or above", "145°F or above", "165°F or above"],
    answer: 0,
    explanation: "Hot holding for TCS food is generally 135°F or above."
  },
  {
    section: "3-401.11",
    category: "Cooking",
    question: "Poultry, baluts, stuffed fish, stuffed meat, and stuffed pasta must be cooked to what minimum temperature?",
    options: ["165°F", "155°F", "145°F", "135°F"],
    answer: 0,
    explanation: "The Food Code places poultry and stuffed foods in the 165°F minimum cooking group."
  },
  {
    section: "3-401.11",
    category: "Cooking",
    question: "Comminuted meat, such as ground beef, is commonly associated with which minimum cooking temperature?",
    options: ["155°F", "145°F", "165°F", "135°F"],
    answer: 0,
    explanation: "Comminuted meat is in the 155°F minimum cooking group."
  },
  {
    section: "3-501.14",
    category: "Cooling",
    question: "Cooked TCS food must cool from 135°F to 70°F within 2 hours, and then to 41°F or less within what total time?",
    options: ["6 hours total", "4 hours total", "8 hours total", "24 hours total"],
    answer: 0,
    explanation: "Cooling is 135°F to 70°F within 2 hours and 135°F to 41°F or less within a total of 6 hours."
  },
  {
    section: "3-501.17",
    category: "Date Marking",
    question: "Refrigerated, ready-to-eat TCS food held at 41°F or less is generally date marked for no more than how many days?",
    options: ["7 days", "3 days", "10 days", "14 days"],
    answer: 0,
    explanation: "The maximum is generally 7 days, counting the preparation or opening day as day 1."
  },
  {
    section: "3-301.11",
    category: "Contamination",
    question: "Which practice is generally prohibited with ready-to-eat food?",
    options: ["Bare-hand contact", "Using deli tissue", "Using single-use gloves", "Using dispensing utensils"],
    answer: 0,
    explanation: "Food employees may not contact exposed ready-to-eat food with bare hands except as allowed by the Code."
  },
  {
    section: "2-201.11",
    category: "Employee Health",
    question: "Which symptom should a food employee report to the person in charge?",
    options: ["Vomiting", "A mild headache only", "Seasonal allergies only", "Tired feet after a long shift"],
    answer: 0,
    explanation: "Vomiting, diarrhea, jaundice, sore throat with fever, and infected lesions are among key reportable items."
  },
  {
    section: "3-603.11",
    category: "Consumer Advisory",
    question: "A consumer advisory is tied to which menu situation?",
    options: ["Raw or undercooked animal foods offered for consumption", "Any food served cold", "All packaged bottled drinks", "Only foods with added sugar"],
    answer: 0,
    explanation: "Consumer advisories apply when raw or undercooked animal foods are offered in ready-to-eat form."
  },
  {
    section: "1-201.10",
    category: "Allergens",
    question: "Which food was added as a major food allergen in the 2022 Food Code era?",
    options: ["Sesame", "Rice", "Chicken", "Tomato"],
    answer: 0,
    explanation: "Sesame joins the major food allergen list reflected in the 2022 Food Code materials."
  },
  {
    section: "3-203.12",
    category: "Shellfish",
    question: "Shellstock tags or labels must generally be kept for how long after the container is emptied?",
    options: ["90 days", "7 days", "30 days", "1 year"],
    answer: 0,
    explanation: "Shellstock tags are retained for 90 calendar days after the container is emptied."
  }
];

const triviaAchievements = [
  { min: 11, title: "Food Code Champion", note: "You are dangerous with a thermometer and a code book." },
  { min: 9, title: "Risk Factor Ranger", note: "Strong command of the stuff that prevents bad days." },
  { min: 6, title: "Inspection Ready", note: "Solid field instincts. Worthy of the clipboard." },
  { min: 3, title: "Code Cadet", note: "You are warming up. Keep the sanitizer test strips close." },
  { min: 0, title: "Fresh Permittee", note: "Everybody starts somewhere. The Food Code is waiting." }
];

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const venueMaps = {
  exhibit: {
    label: "Exhibit Hall",
    src: "assets/sheraton-exhibit-hall-map.png",
    alt: "Sheraton exhibit hall and mezzanine level map",
    caption: "Exhibit hall and mezzanine map from the uploaded Sheraton conference material."
  },
  complex: {
    label: "Complex Map",
    src: "assets/sheraton-meeting-overview.png",
    alt: "Sheraton meeting space overview map",
    caption: "Conference complex overview with lobby, ballroom, and exhibit/mezzanine levels."
  },
  lobby: {
    label: "Hotel Overview",
    src: "assets/sheraton-floor-overview.png",
    alt: "Sheraton Kansas City Hotel floor plan overview",
    caption: "Full floor-plan packet overview from the uploaded Sheraton conference material."
  }
};

loadData().then(([sessions, guide]) => {
  state.sessions = sessions;
  state.guide = guide;
  pruneSaved();
  hydrateControls();
  renderAll();
  runAi();
}).catch((error) => {
  document.querySelector("#sessionList").innerHTML = `<div class="empty-state">The schedule data could not be loaded. Open this folder through a local web server or refresh the bundled app files.</div>`;
  console.error(error);
});

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

els.leadForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = els.leadForm.querySelector('button[type="submit"]');
  const lead = {
    name: els.leadName.value.trim(),
    agency: els.leadAgency.value.trim(),
    email: els.leadEmail.value.trim(),
    capturedAt: new Date().toISOString(),
    source: "NEHA AEC 2026 Guide",
    page: location.href,
    userAgent: navigator.userAgent
  };
  if (!lead.name || !lead.agency || !lead.email || !els.leadEmail.checkValidity()) {
    els.leadForm.reportValidity();
    return;
  }
  submitButton.disabled = true;
  submitButton.textContent = "Saving...";
  try {
    await submitLead(lead);
    state.lead = lead;
    localStorage.setItem("nehaLead", JSON.stringify(lead));
    localStorage.setItem("nehaLeadSubmittedAt", new Date().toISOString());
    renderLeadGate();
  } catch (error) {
    els.leadNote.textContent = "Could not save your pass yet. Please check your connection and try again.";
    console.error(error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enter Guide";
  }
});

els.search.addEventListener("input", (event) => {
  state.query = event.target.value.trim().toLowerCase();
  renderSchedule();
});

els.category.addEventListener("change", (event) => {
  state.category = event.target.value;
  renderSchedule();
});

els.status.addEventListener("change", (event) => {
  state.status = event.target.value;
  renderSchedule();
});

document.querySelector("#clearSaved").addEventListener("click", () => {
  state.saved = { watch: {}, attend: {} };
  persistSaved();
  renderAll();
});

els.aiForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runAi();
});

els.placeFilter.addEventListener("change", (event) => {
  state.placeFilter = event.target.value;
  renderPlaces();
});

els.freeDrinkButton.addEventListener("click", () => {
  if (state.drinkRedeemed) return;
  state.drinkRedeemed = true;
  localStorage.setItem("nehaFreeDrinkRedeemed", "true");
  renderFreeDrink();
});

els.triviaStage.addEventListener("click", (event) => {
  const answerButton = event.target.closest("[data-answer]");
  const hintButton = event.target.closest("[data-trivia-hint]");
  const nextButton = event.target.closest("[data-trivia-next]");
  const restartButton = event.target.closest("[data-trivia-restart]");
  const refreshLeaderboardButton = event.target.closest("[data-trivia-refresh]");

  if (answerButton && !state.trivia.answered) {
    answerTrivia(Number(answerButton.dataset.answer));
    return;
  }
  if (hintButton) {
    useTriviaHint();
    return;
  }
  if (nextButton) {
    nextTriviaQuestion();
    return;
  }
  if (refreshLeaderboardButton) {
    loadTriviaLeaderboard();
    return;
  }
  if (restartButton) restartTrivia();
});

els.installAppButton.addEventListener("click", async () => {
  if (state.installPrompt) {
    state.installPrompt.prompt();
    await state.installPrompt.userChoice;
    state.installPrompt = null;
    renderInstallButton();
    return;
  }
  alert("To save this guide on iPhone: tap Share, then Add to Home Screen. On Android: open the browser menu and choose Install app or Add to Home screen.");
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
  renderInstallButton();
});

window.addEventListener("appinstalled", () => {
  state.installPrompt = null;
  els.installAppButton.textContent = "App Saved";
  els.installAppButton.disabled = true;
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch((error) => console.warn("Service worker registration failed", error));
}

renderLeadGate();
renderInstallButton();
resetTriviaOrder();

async function loadData() {
  if (window.NEHA_DATA?.sessions?.length && window.NEHA_DATA?.guide) {
    return [window.NEHA_DATA.sessions, window.NEHA_DATA.guide];
  }
  const [sessions, guide] = await Promise.all([
    fetch("data/sessions.json").then((r) => {
      if (!r.ok) throw new Error(`Could not load sessions.json: ${r.status}`);
      return r.json();
    }),
    fetch("data/guide.json").then((r) => {
      if (!r.ok) throw new Error(`Could not load guide.json: ${r.status}`);
      return r.json();
    })
  ]);
  return [sessions, guide];
}

async function submitLead(lead) {
  return submitAppPayload({ type: "lead", ...lead });
}

async function submitAppPayload(payload) {
  const endpoint = window.NEHA_LEAD_ENDPOINT || "";
  if (!endpoint) {
    console.warn("App endpoint is not configured. Saving locally only.");
    return;
  }
  await fetch(endpoint, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload)
  });
}

function setView(view) {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
  els.title.textContent = viewTitles[view];
  els.search.style.display = view === "schedule" ? "block" : "none";
  if (view === "my") renderMySchedule();
  if (view === "podcast") renderPodcast();
  if (view === "trivia") renderTrivia();
  if (view === "drink") renderFreeDrink();
}

function hydrateControls() {
  const days = ["all", ...new Set(state.sessions.map((session) => session.date))];
  els.dayTabs.innerHTML = days.map((day) => `<button type="button" class="${day === "all" ? "active" : ""}" data-day="${day}">${dayLabel(day)}</button>`).join("");
  els.dayTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.day = button.dataset.day;
      els.dayTabs.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === button));
      renderSchedule();
    });
  });

  const categories = [...new Set(state.sessions.map((session) => session.category))].sort();
  els.category.innerHTML += categories.map((category) => `<option value="${escapeAttr(category)}">${category}</option>`).join("");

  const placeCategories = [...new Set(state.guide.nearby.map((place) => place.category))].sort();
  els.placeFilter.innerHTML += placeCategories.map((category) => `<option value="${escapeAttr(category)}">${category}</option>`).join("");

  els.venueMapTabs.innerHTML = Object.entries(venueMaps).map(([key, map]) => `<button type="button" class="${key === state.venueMap ? "active" : ""}" data-map="${key}">${map.label}</button>`).join("");
  els.venueMapTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.venueMap = button.dataset.map;
      renderVenue();
    });
  });
}

function renderAll() {
  renderSchedule();
  renderMySchedule();
  renderPlaces();
  renderVenue();
  renderPodcast();
  renderTrivia();
  renderFreeDrink();
  renderLeadGate();
  updateSavedCounts();
}

function renderLeadGate() {
  const hasLead = Boolean(state.lead?.name && state.lead?.agency && state.lead?.email);
  els.leadGate.hidden = hasLead;
  document.body.classList.toggle("lead-locked", !hasLead);
}

function renderFreeDrink() {
  if (state.drinkRedeemed) {
    els.freeDrinkButton.disabled = true;
    els.freeDrinkButton.textContent = "REDEEMED";
    els.freeDrinkStatus.textContent = "Already redeemed on this phone. No stolen beer today.";
  } else {
    els.freeDrinkButton.disabled = false;
    els.freeDrinkButton.textContent = "FREE DRINK";
    els.freeDrinkStatus.textContent = "One redemption per phone/browser.";
  }
}

function renderInstallButton() {
  if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
    els.installAppButton.textContent = "App Saved";
    els.installAppButton.disabled = true;
    return;
  }
  els.installAppButton.textContent = state.installPrompt ? "Download App" : "Save App";
  els.installAppButton.disabled = false;
}

function renderSchedule() {
  const sessions = filteredSessions();
  renderNowNext();
  els.metrics.innerHTML = metricHtml([
    [sessions.length, "sessions shown"],
    [sumCe(sessions), "CE credits visible"],
    [new Set(sessions.map((s) => s.location)).size, "rooms in view"],
    [conflictCount(getAttending()), "attending conflicts"]
  ]);
  renderSessions(els.sessionList, sessions);
}

function renderNowNext() {
  const source = state.sessions.filter((session) => session.category !== "Registration").sort(sortSessions).slice(0, 2);
  els.nowNext.innerHTML = source.map((session, index) => `
    <article>
      <span>${index === 0 ? "Start Here" : "Next Up"}</span>
      <strong>${escapeHtml(session.title)}</strong>
      <small>${formatDate(session.date)} - ${session.time} - ${escapeHtml(session.location)}</small>
    </article>
  `).join("");
}

function filteredSessions() {
  return state.sessions
    .filter((session) => state.day === "all" || session.date === state.day)
    .filter((session) => state.category === "all" || session.category === state.category)
    .filter((session) => {
      if (state.status === "attending") return Boolean(state.saved.attend[session.id]);
      if (state.status === "watching") return Boolean(state.saved.watch[session.id]);
      if (state.status === "ce") return Number(session.ce) > 0;
      return true;
    })
    .filter((session) => matchesQuery(session, state.query))
    .sort(sortSessions);
}

function renderSessions(container, sessions, options = {}) {
  if (!sessions.length) {
    container.innerHTML = `<div class="empty-state">${options.empty || "No sessions match this view yet."}</div>`;
    return;
  }
  const template = document.querySelector("#sessionTemplate");
  container.innerHTML = "";
  sessions.forEach((session) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector('[data-field="start"]').textContent = shortTime(session.start);
    node.querySelector('[data-field="end"]').textContent = shortTime(session.end);
    node.querySelector('[data-field="meta"]').textContent = `${formatDate(session.date)} - ${session.location} - ${session.category}`;
    node.querySelector('[data-field="title"]').textContent = session.title;
    node.querySelector('[data-field="ce"]').textContent = session.ce ? `${session.ceDisplay} CE` : "CE N/A";
    node.querySelector('[data-field="info"]').textContent = session.info;
    node.querySelector('[data-field="tags"]').innerHTML = session.tags.slice(0, 6).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
    const watch = node.querySelector(".watch-btn");
    const attend = node.querySelector(".attend-btn");
    watch.classList.toggle("active", Boolean(state.saved.watch[session.id]));
    attend.classList.toggle("active", Boolean(state.saved.attend[session.id]));
    watch.textContent = state.saved.watch[session.id] ? "Watching" : "Watch";
    attend.textContent = state.saved.attend[session.id] ? "Attending" : "Attend";
    watch.addEventListener("click", () => toggleSaved("watch", session.id));
    attend.addEventListener("click", () => toggleSaved("attend", session.id));
    container.appendChild(node);
  });
}

function renderMySchedule() {
  const attending = getAttending();
  const watching = getWatching().filter((session) => !state.saved.attend[session.id]);
  const combined = [...attending, ...watching].sort(sortSessions);
  const days = [...new Set(state.sessions.map((session) => session.date))];
  if (!state.myDay) state.myDay = days[0];
  if (combined.length && !combined.some((session) => session.date === state.myDay)) {
    state.myDay = combined[0].date;
  }
  renderMyDayTabs(days, combined);
  renderDailyGrid(combined);
  renderConflictBanner();
  els.mySummary.innerHTML = metricHtml([
    [attending.length, "marked attending"],
    [watching.length, "watch-list only"],
    [sumCe(attending), "planned CE credits"],
    [conflictCount(attending), "time conflicts"]
  ]);
}

function renderMyDayTabs(days, savedSessions) {
  els.myDayTabs.innerHTML = days.map((day) => {
    const count = savedSessions.filter((session) => session.date === day).length;
    const label = `${dayLabel(day)} ${count ? `(${count})` : ""}`;
    return `<button type="button" class="${day === state.myDay ? "active" : ""}" data-day="${day}">${label}</button>`;
  }).join("");
  els.myDayTabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      state.myDay = button.dataset.day;
      renderMySchedule();
    });
  });
}

function renderDailyGrid(savedSessions) {
  const dayItems = savedSessions.filter((session) => session.date === state.myDay).sort(sortSessions);
  if (!dayItems.length) {
    els.myDailyGrid.innerHTML = `<div class="empty-state">No saved sessions for ${dayLabel(state.myDay)} yet.</div>`;
    return;
  }
  els.myDailyGrid.innerHTML = dayItems.map((session) => {
    const kind = state.saved.attend[session.id] ? "Attending" : "Watching";
    const conflictClass = findConflicts(session).length && kind === "Attending" ? " has-conflict" : "";
    return `
      <article class="day-block${conflictClass}">
        <div class="day-time">${shortTime(session.start)} - ${shortTime(session.end)}</div>
        <div>
          <strong>${escapeHtml(session.title)}</strong>
          <span>${escapeHtml(session.location)} - ${escapeHtml(kind)}</span>
        </div>
      </article>
    `;
  }).join("");
}

function runAi() {
  const prompt = els.aiPrompt.value.toLowerCase();
  const profile = buildProfile(prompt);
  const scored = state.sessions
    .filter((session) => session.category !== "Registration")
    .map((session) => ({ session, score: scoreSession(session, profile) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || sortSessions(a.session, b.session))
    .slice(0, 12)
    .map((item) => item.session);

  els.aiReasons.innerHTML = profile.reasons.map((reason) => `<span class="reason">${escapeHtml(reason)}</span>`).join("");
  renderSessions(els.aiResults, scored, { empty: "Try a role, topic, CE target, or phrase like food inspector, water quality, data, climate, or leadership." });
}

function buildProfile(prompt) {
  const signals = [
    { keys: ["food", "restaurant", "retail", "foodborne"], categories: ["Food Safety", "RFFM/Retail Program Standards"], tags: ["Food Safety & Defense", "Retail & Home Restaurants"], reason: "Prioritizing food safety and retail program standards." },
    { keys: ["water", "pool", "aquatic", "well", "wastewater"], categories: ["Water Quality"], tags: ["Recreational Water", "Private Drinking Water", "Onsite Wastewater"], reason: "Looking for water quality and aquatic health sessions." },
    { keys: ["director", "leader", "manager", "workforce", "staff"], categories: ["Workforce & Leadership"], tags: ["Leadership & Management"], reason: "Adding leadership and workforce development." },
    { keys: ["climate", "heat", "resilience"], categories: ["Climate & Health", "Emergency Readiness, Recovery, & Resilience"], tags: ["Adaptation & Mitigation", "Extreme Heat"], reason: "Focusing on climate, heat, and resilience." },
    { keys: ["data", "technology", "ai", "software"], categories: ["Data & Technology"], tags: ["Technology & Environmental Health", "Artificial Intelligence (AI)"], reason: "Elevating data, technology, and AI topics." },
    { keys: ["vector", "pest", "rodent", "mosquito"], categories: ["Infectious & Vector-borne Diseases"], tags: ["Vector Control & Zoonotic Disease"], reason: "Matching vector control and pest topics." },
    { keys: ["student", "career", "network"], categories: ["Networking Event"], tags: ["Student & Young Professional Career Development", "Networking Event"], reason: "Including networking and career-building options." },
    { keys: ["ce", "credit", "credits"], categories: [], tags: [], reason: "Favoring sessions with CE credit." }
  ];
  const profile = { categories: new Set(), tags: new Set(), ce: prompt.includes("ce") || prompt.includes("credit"), workshop: prompt.includes("workshop"), reasons: [] };
  signals.forEach((signal) => {
    if (signal.keys.some((key) => promptHasKey(prompt, key))) {
      signal.categories.forEach((category) => profile.categories.add(category));
      signal.tags.forEach((tag) => profile.tags.add(tag));
      profile.reasons.push(signal.reason);
    }
  });
  if (!profile.reasons.length) profile.reasons.push("Using broad environmental health relevance across the uploaded schedule.");
  return profile;
}

function promptHasKey(prompt, key) {
  if (key.length <= 2) {
    return new RegExp(`\\b${key}\\b`, "i").test(prompt);
  }
  return prompt.includes(key);
}

function scoreSession(session, profile) {
  const haystack = `${session.title} ${session.category} ${session.tags.join(" ")} ${session.info}`.toLowerCase();
  let score = 0;
  if (profile.categories.has(session.category)) score += 7;
  session.tags.forEach((tag) => {
    if (profile.tags.has(tag)) score += 4;
  });
  if (profile.ce && Number(session.ce) > 0) score += Math.min(4, Number(session.ce));
  if (profile.workshop && haystack.includes("workshop")) score += 3;
  profile.categories.forEach((category) => {
    category.toLowerCase().split(/[^a-z]+/).filter(Boolean).forEach((word) => {
      if (haystack.includes(word)) score += 0.5;
    });
  });
  if (!profile.categories.size && !profile.tags.size) score = Number(session.ce) > 0 ? 1 : 0;
  return score;
}

function renderPlaces() {
  const places = state.guide.nearby.filter((place) => state.placeFilter === "all" || place.category === state.placeFilter);
  els.kcSourceLinks.innerHTML = state.guide.kcSources.map((source) => `<a href="${escapeAttr(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.name)}</a>`).join("");
  els.placeGrid.innerHTML = places.map((place) => `
    <article class="place-card">
      <span class="place-category">${escapeHtml(place.category)}</span>
      <a class="place-title" href="${escapeAttr(placeUrl(place))}" target="_blank" rel="noreferrer">${escapeHtml(place.name)}</a>
      <small>${escapeHtml(place.meta)}</small>
      <p>${escapeHtml(place.description)}</p>
    </article>
  `).join("");
}

function renderVenue() {
  const map = venueMaps[state.venueMap];
  els.venueMapImage.src = map.src;
  els.venueMapImage.alt = map.alt;
  els.venueMapCaption.textContent = map.caption;
  els.venueMapTabs.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.map === state.venueMap));
  const tips = [
    ...state.guide.hotel.summary.slice(2, 8),
    "Room hints: Atlanta, New York, San Francisco, Chicago, Chouteau, Empire, The Terrace, and Exhibit Hall spaces are mapped from the uploaded Sheraton floor-plan packet."
  ];
  els.hotelTips.innerHTML = tips.map((tip) => `<div class="info-note">${escapeHtml(tip)}</div>`).join("");
}

function renderPodcast() {
  els.podcastGrid.innerHTML = podcastEpisodes.map((episode) => `
    <article class="podcast-card">
      <div class="video-frame">
        <iframe src="${escapeAttr(episode.embed)}" title="${escapeAttr(episode.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
      </div>
      <div class="podcast-card-body">
        <p class="session-kicker">${escapeHtml(episode.published)}</p>
        <h3>${escapeHtml(episode.title)}</h3>
        <p>${escapeHtml(episode.description)}</p>
        <a href="${escapeAttr(episode.url)}" target="_blank" rel="noreferrer">Watch on YouTube</a>
      </div>
    </article>
  `).join("");
}

function renderTrivia() {
  const trivia = state.trivia;
  const total = triviaQuestions.length;
  els.triviaScore.textContent = `${trivia.score}/${total}`;
  els.triviaProgressBar.style.width = `${Math.round((trivia.index / total) * 100)}%`;

  if (trivia.complete) {
    renderTriviaResults();
    return;
  }

  const question = triviaQuestions[trivia.index];
  const status = trivia.answered ? (trivia.selected === question.answer ? "Correct" : "Not quite") : "Choose one";
  els.triviaStage.innerHTML = `
    <div class="trivia-card">
      <div class="trivia-meta">
        <span>Question ${trivia.index + 1} of ${total}</span>
        <span>${escapeHtml(question.category)}</span>
        <span>${escapeHtml(question.section)}</span>
      </div>
      <h3>${escapeHtml(question.question)}</h3>
      <div class="answer-grid">
        ${triviaOptionOrder(question).map((index) => triviaAnswerButton(question, question.options[index], index)).join("")}
      </div>
      <div class="trivia-feedback ${trivia.answered ? "show" : ""}">
        <strong>${escapeHtml(status)}</strong>
        <p>${trivia.answered ? escapeHtml(question.explanation) : "Lock in an answer to reveal the Food Code note."}</p>
      </div>
      <div class="trivia-footer">
        <button class="hint-button" type="button" data-trivia-hint ${trivia.answered || trivia.hintsRemaining <= 0 || hiddenTriviaOptions().length >= question.options.length - 2 ? "disabled" : ""}>Use Hint (${trivia.hintsRemaining})</button>
        <div>
          <span>Streak</span>
          <strong>${trivia.streak}</strong>
        </div>
        <div>
          <span>Best</span>
          <strong>${trivia.best}/${total}</strong>
        </div>
        <button type="button" data-trivia-next ${trivia.answered ? "" : "disabled"}>${trivia.index === total - 1 ? "Finish" : "Next"}</button>
      </div>
    </div>
  `;
}

function triviaAnswerButton(question, option, index) {
  const trivia = state.trivia;
  let stateClass = "";
  if (trivia.answered && index === question.answer) stateClass = "correct";
  if (trivia.answered && trivia.selected === index && index !== question.answer) stateClass = "wrong";
  if (!trivia.answered && hiddenTriviaOptions().includes(index)) stateClass = "hidden";
  return `<button class="${stateClass}" type="button" data-answer="${index}" ${stateClass === "hidden" ? "disabled" : ""}>${escapeHtml(option)}</button>`;
}

function triviaOptionOrder(question) {
  if (!state.trivia.order.length) resetTriviaOrder();
  return state.trivia.order[state.trivia.index] || question.options.map((_, index) => index);
}

function hiddenTriviaOptions() {
  return state.trivia.hidden[state.trivia.index] || [];
}

function resetTriviaOrder() {
  state.trivia.order = triviaQuestions.map((question) => shuffleArray(question.options.map((_, index) => index)));
}

function shuffleArray(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function useTriviaHint() {
  const question = triviaQuestions[state.trivia.index];
  if (state.trivia.answered || state.trivia.hintsRemaining <= 0) return;
  const hidden = hiddenTriviaOptions();
  const candidates = triviaOptionOrder(question).filter((index) => index !== question.answer && !hidden.includes(index));
  if (!candidates.length) return;
  const removed = candidates[Math.floor(Math.random() * candidates.length)];
  state.trivia.hidden[state.trivia.index] = [...hidden, removed];
  state.trivia.hintsRemaining -= 1;
  renderTrivia();
}

function answerTrivia(index) {
  const question = triviaQuestions[state.trivia.index];
  state.trivia.selected = index;
  state.trivia.answered = true;
  if (index === question.answer) {
    state.trivia.score += 1;
    state.trivia.streak += 1;
  } else {
    state.trivia.streak = 0;
  }
  renderTrivia();
}

function nextTriviaQuestion() {
  if (!state.trivia.answered) return;
  if (state.trivia.index >= triviaQuestions.length - 1) {
    state.trivia.complete = true;
    state.trivia.best = Math.max(state.trivia.best, state.trivia.score);
    localStorage.setItem("nehaTriviaBest", String(state.trivia.best));
    postTriviaScore();
  } else {
    state.trivia.index += 1;
    state.trivia.selected = null;
    state.trivia.answered = false;
  }
  renderTrivia();
}

function restartTrivia() {
  state.trivia.index = 0;
  state.trivia.score = 0;
  state.trivia.selected = null;
  state.trivia.answered = false;
  state.trivia.complete = false;
  state.trivia.streak = 0;
  state.trivia.hintsRemaining = 3;
  state.trivia.hidden = {};
  state.trivia.submitted = false;
  state.trivia.submitting = false;
  state.trivia.leaderboardError = "";
  resetTriviaOrder();
  renderTrivia();
}

function renderTriviaResults() {
  const total = triviaQuestions.length;
  const achievement = triviaAchievements.find((item) => state.trivia.score >= item.min);
  const perfect = state.trivia.score === total;
  const postStatus = state.trivia.submitted ? "Score posted to the leaderboard." : state.trivia.submitting ? "Posting score to the leaderboard..." : "Score will post automatically.";
  els.triviaProgressBar.style.width = "100%";
  els.triviaStage.innerHTML = `
    <div class="trivia-result">
      <p class="eyebrow">Round complete</p>
      <h3>${escapeHtml(achievement.title)}</h3>
      <div class="result-score">${state.trivia.score}<span>/${total}</span></div>
      <p>${escapeHtml(achievement.note)}</p>
      ${perfect ? `
        <div class="perfect-prize">
          <strong>Congrats, 12 for 12!</strong>
          <span>Go to the HS GovTech booth for a special prize.</span>
        </div>
      ` : ""}
      <div class="score-actions">
        <span>${escapeHtml(postStatus)}</span>
        <button type="button" data-trivia-refresh>Refresh Leaderboard</button>
      </div>
      ${renderLeaderboard()}
      <div class="achievement-list">
        ${triviaAchievements.map((item) => `
          <div class="${state.trivia.score >= item.min ? "earned" : ""}">
            <strong>${escapeHtml(item.title)}</strong>
            <span>${item.min}+ correct</span>
          </div>
        `).join("")}
      </div>
      <button type="button" data-trivia-restart>Play Again</button>
    </div>
  `;
}

function renderLeaderboard() {
  if (state.trivia.leaderboardLoading) return `<div class="leaderboard-card">Loading leaderboard...</div>`;
  if (state.trivia.leaderboardError) return `<div class="leaderboard-card">${escapeHtml(state.trivia.leaderboardError)}</div>`;
  if (!state.trivia.leaderboard.length) return `<div class="leaderboard-card">Post a score to start the leaderboard.</div>`;
  return `
    <div class="leaderboard-card">
      <div class="leaderboard-head">
        <strong>Leaderboard</strong>
        <span>Top ${state.trivia.leaderboard.length}</span>
      </div>
      ${state.trivia.leaderboard.map((entry) => `
        <div class="leaderboard-row">
          <span>${escapeHtml(String(entry.rank))}</span>
          <strong>${escapeHtml(entry.name)}</strong>
          <small>${escapeHtml(entry.agency || "Agency not listed")}</small>
          <b>${escapeHtml(String(entry.score))}/12</b>
        </div>
      `).join("")}
    </div>
  `;
}

async function postTriviaScore() {
  if (state.trivia.submitted || state.trivia.submitting) return;
  state.trivia.submitting = true;
  renderTrivia();
  const achievement = triviaAchievements.find((item) => state.trivia.score >= item.min);
  const payload = {
    type: "triviaScore",
    name: state.lead?.name || "",
    agency: state.lead?.agency || "",
    email: state.lead?.email || "",
    score: state.trivia.score,
    total: triviaQuestions.length,
    achievement: achievement.title,
    hintsUsed: 3 - state.trivia.hintsRemaining,
    completedAt: new Date().toISOString(),
    source: "NEHA AEC 2026 Guide",
    page: location.href
  };
  try {
    await submitAppPayload(payload);
    state.trivia.submitted = true;
    await loadTriviaLeaderboard();
  } catch (error) {
    state.trivia.leaderboardError = "Could not post score yet. Check connection and try again.";
    console.error(error);
  } finally {
    state.trivia.submitting = false;
    renderTrivia();
  }
}

function loadTriviaLeaderboard() {
  const endpoint = window.NEHA_LEAD_ENDPOINT || "";
  if (!endpoint) {
    state.trivia.leaderboardError = "Leaderboard is not configured yet.";
    renderTrivia();
    return Promise.resolve();
  }
  state.trivia.leaderboardLoading = true;
  state.trivia.leaderboardError = "";
  renderTrivia();
  return new Promise((resolve) => {
    const callbackName = `nehaLeaderboard${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      state.trivia.leaderboardLoading = false;
      state.trivia.leaderboardError = "Leaderboard is taking a breather. Try refresh in a moment.";
      renderTrivia();
      resolve();
    }, 8000);
    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }
    window[callbackName] = (data) => {
      cleanup();
      state.trivia.leaderboard = Array.isArray(data?.leaders) ? data.leaders : [];
      state.trivia.leaderboardLoading = false;
      renderTrivia();
      resolve();
    };
    script.src = `${endpoint}?action=leaderboard&callback=${callbackName}&t=${Date.now()}`;
    script.onerror = () => {
      cleanup();
      state.trivia.leaderboardLoading = false;
      state.trivia.leaderboardError = "Leaderboard could not load yet.";
      renderTrivia();
      resolve();
    };
    document.body.appendChild(script);
  });
}

function toggleSaved(kind, id) {
  if (state.saved[kind][id]) {
    delete state.saved[kind][id];
  } else {
    if (kind === "attend") {
      const session = sessionById(id);
      const conflicts = findConflicts(session);
      if (conflicts.length) {
        state.pendingConflict = { id, conflicts: conflicts.map((conflict) => conflict.id) };
        renderConflictBanner();
        setView("my");
        return;
      }
    }
    state.saved[kind][id] = true;
    if (kind === "attend") state.saved.watch[id] = true;
  }
  persistSaved();
  renderAll();
}

function renderConflictBanner() {
  if (!state.pendingConflict) {
    els.conflictBanner.hidden = true;
    els.conflictBanner.innerHTML = "";
    return;
  }
  const session = sessionById(state.pendingConflict.id);
  const conflicts = state.pendingConflict.conflicts.map(sessionById).filter(Boolean);
  els.conflictBanner.hidden = false;
  els.conflictBanner.innerHTML = `
    <div>
      <strong>So much goodness - you have a choice to make</strong>
      <p>${escapeHtml(session.title)} overlaps with ${escapeHtml(conflicts.map((conflict) => `${conflict.title} (${conflict.time})`).join("; "))}.</p>
    </div>
    <div class="conflict-actions">
      <button type="button" data-conflict="cancel">Keep current</button>
      <button type="button" data-conflict="add">Add anyway</button>
    </div>
  `;
  els.conflictBanner.querySelector('[data-conflict="cancel"]').addEventListener("click", () => {
    state.pendingConflict = null;
    renderConflictBanner();
  });
  els.conflictBanner.querySelector('[data-conflict="add"]').addEventListener("click", () => {
    state.saved.attend[session.id] = true;
    state.saved.watch[session.id] = true;
    state.pendingConflict = null;
    persistSaved();
    renderAll();
  });
}

function findConflicts(session) {
  if (!session) return [];
  return getAttending().filter((attending) => attending.id !== session.id && attending.date === session.date && session.start < attending.end && session.end > attending.start);
}

function sessionById(id) {
  return state.sessions.find((session) => session.id === id);
}

function placeUrl(place) {
  const address = place.meta.split("—")[0].trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${address} Kansas City MO`)}`;
}

function persistSaved() {
  localStorage.setItem("nehaSaved", JSON.stringify(state.saved));
}

function pruneSaved() {
  const valid = new Set(state.sessions.map((session) => session.id));
  ["watch", "attend"].forEach((kind) => {
    Object.keys(state.saved[kind] || {}).forEach((id) => {
      if (!valid.has(id)) delete state.saved[kind][id];
    });
  });
  persistSaved();
}

function updateSavedCounts() {
  els.watchCount.textContent = `${Object.keys(state.saved.watch).length} watching`;
  els.attendCount.textContent = `${Object.keys(state.saved.attend).length} attending`;
}

function getAttending() {
  return state.sessions.filter((session) => state.saved.attend[session.id]);
}

function getWatching() {
  return state.sessions.filter((session) => state.saved.watch[session.id]);
}

function conflictCount(sessions) {
  let conflicts = 0;
  const byDay = Map.groupBy ? Map.groupBy(sessions, (session) => session.date) : groupByDate(sessions);
  byDay.forEach((items) => {
    const sorted = [...items].sort(sortSessions);
    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].start < sorted[i - 1].end) conflicts += 1;
    }
  });
  return conflicts;
}

function groupByDate(items) {
  const map = new Map();
  items.forEach((item) => {
    if (!map.has(item.date)) map.set(item.date, []);
    map.get(item.date).push(item);
  });
  return map;
}

function matchesQuery(session, query) {
  if (!query) return true;
  return `${session.title} ${session.location} ${session.category} ${session.tags.join(" ")} ${session.info}`.toLowerCase().includes(query);
}

function metricHtml(items) {
  return items.map(([value, label]) => `<div class="metric"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`).join("");
}

function sumCe(sessions) {
  return sessions.reduce((sum, session) => sum + (Number(session.ce) || 0), 0).toFixed(1).replace(".0", "");
}

function sortSessions(a, b) {
  return a.date.localeCompare(b.date) || a.start.localeCompare(b.start) || a.title.localeCompare(b.title);
}

function dayLabel(day) {
  return day === "all" ? "All days" : dayFormatter.format(new Date(`${day}T12:00:00`));
}

function formatDate(day) {
  return dayFormatter.format(new Date(`${day}T12:00:00`));
}

function shortTime(value) {
  const [hourText, minute] = value.split(":");
  const hour = Number(hourText);
  const suffix = hour < 12 ? "AM" : "PM";
  return `${hour % 12 || 12}:${minute} ${suffix}`;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value);
}
