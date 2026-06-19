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
  drinkRedeemed: localStorage.getItem("nehaFreeDrinkRedeemed") === "true",
  saved: JSON.parse(localStorage.getItem("nehaSaved") || '{"watch":{},"attend":{}}')
};

const els = {
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
  drink: "FREE DRINK"
};

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

function setView(view) {
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  document.querySelectorAll(".view").forEach((panel) => panel.classList.toggle("active", panel.id === `${view}View`));
  els.title.textContent = viewTitles[view];
  els.search.style.display = view === "schedule" ? "block" : "none";
  if (view === "my") renderMySchedule();
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
  renderFreeDrink();
  updateSavedCounts();
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
