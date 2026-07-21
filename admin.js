(function () {
  const config = window.NEHA_SUPABASE_CONFIG || {};
  const endpoint = config.adminEndpoint || (config.edgeEndpoint || "").replace(/\/app-api$/, "/admin-api");
  const sections = [
    ["leads", "Leads", "Name, agency, email, and source from first app entry."],
    ["demos", "Demo Requests", "People who asked for an HS CloudSuite demo."],
    ["trivia", "Trivia Scores", "Scores by board, including hints and achievements."],
    ["drinks", "Free Drinks", "Issued and served drink QR tickets."],
    ["community", "Community", "Community posts and replies, including image links."],
    ["sessionQuestions", "Session Q&A", "Questions and replies attached to sessions."],
    ["emails", "Email Log", "Schedule, notes, trivia, and daily email delivery status."],
    ["alerts", "App Alerts", "Rotating in-app alerts and sponsored messages."]
  ];
  const state = {
    token: sessionStorage.getItem("conferenceGuideAdminToken") || "",
    section: "leads",
    rows: [],
    summary: {},
    selected: new Map()
  };

  const els = {
    login: document.querySelector("#adminLogin"),
    app: document.querySelector("#adminApp"),
    form: document.querySelector("#adminAuthForm"),
    token: document.querySelector("#adminToken"),
    authStatus: document.querySelector("#adminAuthStatus"),
    tabs: document.querySelector("#adminTabs"),
    refresh: document.querySelector("#adminRefresh"),
    summary: document.querySelector("#adminSummary"),
    title: document.querySelector("#adminSectionTitle"),
    help: document.querySelector("#adminSectionHelp"),
    table: document.querySelector("#adminTable"),
    export: document.querySelector("#adminExport"),
    alertsPanel: document.querySelector("#adminAlertsPanel"),
    alertForm: document.querySelector("#alertForm"),
    alertStatus: document.querySelector("#alertStatus")
  };

  els.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    state.token = els.token.value.trim();
    sessionStorage.setItem("conferenceGuideAdminToken", state.token);
    await boot();
  });

  els.refresh.addEventListener("click", () => loadSection(state.section));
  els.export.addEventListener("click", () => exportCsv(state.section));
  els.tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-section]");
    if (button) loadSection(button.dataset.section);
  });

  els.table.addEventListener("click", async (event) => {
    const editAlert = event.target.closest("[data-edit-alert]");
    const statusButton = event.target.closest("[data-status]");
    const deleteButton = event.target.closest("[data-delete-table]");
    const bulkDeleteButton = event.target.closest("[data-bulk-delete]");
    if (editAlert) {
      const row = state.rows.find((item) => item.id === editAlert.dataset.editAlert);
      if (row) fillAlertForm(row);
    }
    if (statusButton) {
      await postAdmin({
        action: "admin:setStatus",
        table: statusButton.dataset.table,
        id: statusButton.dataset.id,
        status: statusButton.dataset.status
      });
      await loadSection(state.section);
    }
    if (deleteButton) {
      const label = deleteButton.dataset.deleteLabel || "this record";
      const confirmed = window.confirm(`Delete ${label}? This permanently removes the record from Supabase.`);
      if (!confirmed) return;
      deleteButton.disabled = true;
      deleteButton.textContent = "Deleting...";
      await postAdmin({
        action: "admin:deleteRecord",
        table: deleteButton.dataset.deleteTable,
        id: deleteButton.dataset.deleteId
      });
      await loadSection(state.section);
    }
    if (bulkDeleteButton) {
      const records = Array.from(state.selected.values());
      if (!records.length) return;
      const confirmed = window.confirm(`Delete ${records.length} selected record${records.length === 1 ? "" : "s"}? This permanently removes them from Supabase.`);
      if (!confirmed) return;
      bulkDeleteButton.disabled = true;
      bulkDeleteButton.textContent = "Deleting...";
      await postAdmin({
        action: "admin:deleteRecords",
        records: records.map(({ table, id }) => ({ table, id }))
      });
      state.selected.clear();
      await loadSection(state.section);
    }
  });

  els.table.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-select-record], [data-select-all]");
    if (!checkbox) return;
    if (checkbox.matches("[data-select-all]")) {
      const checkboxes = els.table.querySelectorAll("[data-select-record]");
      checkboxes.forEach((item) => {
        item.checked = checkbox.checked;
        updateSelectionFromCheckbox(item);
      });
    } else {
      updateSelectionFromCheckbox(checkbox);
    }
    updateBulkControls();
  });

  els.alertForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    els.alertStatus.textContent = "Saving...";
    await postAdmin({
      action: "admin:saveAlert",
      id: document.querySelector("#alertId").value,
      title: document.querySelector("#alertTitle").value,
      message: document.querySelector("#alertMessage").value,
      buttonLabel: document.querySelector("#alertButton").value,
      view: document.querySelector("#alertView").value,
      priority: Number(document.querySelector("#alertPriority").value || 0),
      active: document.querySelector("#alertActive").checked
    });
    resetAlertForm();
    els.alertStatus.textContent = "Alert saved.";
    await loadSection("alerts");
  });

  document.querySelector("#alertReset").addEventListener("click", resetAlertForm);

  if (state.token) {
    els.token.value = state.token;
    boot();
  }

  async function boot() {
    if (!endpoint) {
      els.authStatus.textContent = "Admin endpoint is not configured yet.";
      return;
    }
    try {
      await loadSection(state.section);
      els.login.hidden = true;
      els.app.hidden = false;
    } catch (error) {
      els.authStatus.textContent = error.message || "Could not unlock console.";
    }
  }

  async function loadSection(section) {
    state.section = section;
    state.selected.clear();
    const sectionMeta = sections.find(([id]) => id === section) || sections[0];
    renderTabs();
    els.title.textContent = sectionMeta[1];
    els.help.textContent = sectionMeta[2];
    els.table.innerHTML = `<div class="empty-state">Loading ${escapeHtml(sectionMeta[1])}...</div>`;
    els.alertsPanel.hidden = section !== "alerts";
    const data = await getAdmin({ section, limit: 200 });
    state.rows = Array.isArray(data.rows) ? data.rows : [];
    state.summary = data.summary || state.summary || {};
    renderSummary();
    renderTable(section, state.rows);
  }

  async function getAdmin(params) {
    const url = new URL(endpoint);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await fetch(url.toString(), { headers: adminHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Admin request failed: ${response.status}`);
    return data;
  }

  async function postAdmin(payload) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) throw new Error(data.error || `Admin update failed: ${response.status}`);
    return data;
  }

  function adminHeaders() {
    const headers = {
      "Content-Type": "application/json",
      "x-admin-token": state.token
    };
    if (config.anonKey) {
      headers.apikey = config.anonKey;
      headers.Authorization = `Bearer ${config.anonKey}`;
    }
    return headers;
  }

  function renderTabs() {
    els.tabs.innerHTML = sections.map(([id, label]) => `
      <button type="button" class="${id === state.section ? "active" : ""}" data-section="${id}">${escapeHtml(label)}</button>
    `).join("");
  }

  function renderSummary() {
    const metrics = [
      ["Leads", state.summary.leads],
      ["Demos", state.summary.demos],
      ["Trivia", state.summary.trivia],
      ["Drinks", state.summary.drinks]
    ];
    els.summary.innerHTML = metrics.map(([label, value]) => `
      <div class="admin-metric"><strong>${escapeHtml(String(value ?? 0))}</strong><span>${escapeHtml(label)}</span></div>
    `).join("");
  }

  function renderTable(section, rows) {
    if (!rows.length) {
      els.table.innerHTML = `<div class="empty-state">No records yet.</div>`;
      return;
    }
    const columns = columnsFor(section, rows);
    const selectableCount = rows.filter((row) => deleteTableFor(section, row) && row.id).length;
    els.table.innerHTML = `
      <div class="admin-bulk-bar" data-bulk-bar ${selectableCount ? "" : "hidden"}>
        <span data-selected-count>0 selected</span>
        <button class="danger-action" type="button" data-bulk-delete disabled>Delete Selected</button>
      </div>
      <table class="admin-table">
        <thead><tr><th class="admin-select-cell"><input type="checkbox" data-select-all aria-label="Select all visible records"></th>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}<th>Actions</th></tr></thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              ${selectionCellHtml(section, row)}
              ${columns.map((column) => `<td>${cellHtml(row[column.key])}</td>`).join("")}
              <td>${actionHtml(section, row)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    updateBulkControls();
  }

  function columnsFor(section, rows) {
    const preferred = {
      leads: ["submitted_at", "full_name", "agency", "email", "source"],
      demos: ["requested_at", "full_name", "agency", "email", "phone", "state", "notes"],
      trivia: ["completed_at", "board_id", "full_name", "agency", "email", "score", "total", "achievement", "hints_used"],
      drinks: ["issued_at", "redemption_code", "full_name", "agency", "email", "status", "served_at"],
      community: ["posted_at", "kind", "category", "title", "message", "display_name", "agency", "email", "status", "image_url"],
      sessionQuestions: ["posted_at", "kind", "session_title", "title", "message", "display_name", "agency", "email", "status"],
      emails: ["created_at", "email_type", "recipient_email", "subject", "status", "error_message"],
      alerts: ["created_at", "title", "message", "button_label", "view", "active", "priority"]
    };
    return (preferred[section] || Object.keys(rows[0])).filter((key) => rows.some((row) => row[key] !== undefined)).map((key) => ({
      key,
      label: key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())
    }));
  }

  function actionHtml(section, row) {
    const deleteAction = deleteActionHtml(section, row);
    if (section === "alerts") {
      return `<div class="admin-row-actions"><button type="button" data-edit-alert="${escapeAttr(row.id)}">Edit</button>${deleteAction}</div>`;
    }
    if (section === "community" && row.id && row.kind) {
      const table = row.kind === "Reply" ? "community_replies" : "community_posts";
      const next = row.status === "Hidden" ? "Visible" : "Hidden";
      return `<div class="admin-row-actions"><button type="button" data-table="${table}" data-id="${escapeAttr(row.id)}" data-status="${next}">${next === "Hidden" ? "Hide" : "Show"}</button>${deleteAction}</div>`;
    }
    if (section === "sessionQuestions" && row.id && row.kind) {
      const table = row.kind === "Reply" ? "session_question_replies" : "session_questions";
      const next = row.status === "Hidden" ? "Visible" : "Hidden";
      return `<div class="admin-row-actions"><button type="button" data-table="${table}" data-id="${escapeAttr(row.id)}" data-status="${next}">${next === "Hidden" ? "Hide" : "Show"}</button>${deleteAction}</div>`;
    }
    return deleteAction ? `<div class="admin-row-actions">${deleteAction}</div>` : "";
  }

  function deleteActionHtml(section, row) {
    const table = deleteTableFor(section, row);
    if (!table || !row.id) return "";
    const label = row.title || row.full_name || row.email || row.redemption_code || `${section} record`;
    return `<button class="danger-action" type="button" data-delete-table="${escapeAttr(table)}" data-delete-id="${escapeAttr(row.id)}" data-delete-label="${escapeAttr(label)}">Delete</button>`;
  }

  function deleteTableFor(section, row) {
    if (section === "community" && row.kind) return row.kind === "Reply" ? "community_replies" : "community_posts";
    if (section === "sessionQuestions" && row.kind) return row.kind === "Reply" ? "session_question_replies" : "session_questions";
    const tables = {
      leads: "lead_captures",
      demos: "demo_requests",
      trivia: "trivia_scores",
      drinks: "drink_redemptions",
      emails: "outbound_email_log",
      alerts: "app_alerts"
    };
    return tables[section] || "";
  }

  function selectionCellHtml(section, row) {
    const table = deleteTableFor(section, row);
    if (!table || !row.id) return `<td class="admin-select-cell"></td>`;
    const label = row.title || row.full_name || row.email || row.redemption_code || `${section} record`;
    const key = selectionKey(table, row.id);
    return `
      <td class="admin-select-cell">
        <input
          type="checkbox"
          data-select-record
          data-select-key="${escapeAttr(key)}"
          data-select-table="${escapeAttr(table)}"
          data-select-id="${escapeAttr(row.id)}"
          data-select-label="${escapeAttr(label)}"
          aria-label="Select ${escapeAttr(label)}"
          ${state.selected.has(key) ? "checked" : ""}
        >
      </td>
    `;
  }

  function updateSelectionFromCheckbox(checkbox) {
    const key = checkbox.dataset.selectKey;
    if (!key) return;
    if (checkbox.checked) {
      state.selected.set(key, {
        table: checkbox.dataset.selectTable,
        id: checkbox.dataset.selectId,
        label: checkbox.dataset.selectLabel
      });
    } else {
      state.selected.delete(key);
    }
  }

  function updateBulkControls() {
    const bulkBar = els.table.querySelector("[data-bulk-bar]");
    const countLabel = els.table.querySelector("[data-selected-count]");
    const bulkButton = els.table.querySelector("[data-bulk-delete]");
    const selectAll = els.table.querySelector("[data-select-all]");
    const checkboxes = Array.from(els.table.querySelectorAll("[data-select-record]"));
    const selectedVisible = checkboxes.filter((checkbox) => checkbox.checked).length;
    if (countLabel) countLabel.textContent = `${selectedVisible} selected`;
    if (bulkButton) bulkButton.disabled = selectedVisible === 0;
    if (bulkBar) bulkBar.hidden = checkboxes.length === 0;
    if (selectAll) {
      selectAll.checked = checkboxes.length > 0 && selectedVisible === checkboxes.length;
      selectAll.indeterminate = selectedVisible > 0 && selectedVisible < checkboxes.length;
    }
  }

  function selectionKey(table, id) {
    return `${table}:${id}`;
  }

  function cellHtml(value) {
    if (value == null || value === "") return "";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") return `<code>${escapeHtml(JSON.stringify(value))}</code>`;
    const text = String(value);
    if (/^https?:\/\//.test(text)) return `<a href="${escapeAttr(text)}" target="_blank" rel="noopener">${escapeHtml(text)}</a>`;
    return escapeHtml(text);
  }

  async function exportCsv(section) {
    const url = new URL(endpoint);
    url.searchParams.set("section", section);
    url.searchParams.set("format", "csv");
    const response = await fetch(url.toString(), { headers: adminHeaders() });
    if (!response.ok) throw new Error("CSV export failed.");
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `conference-guide-${section}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  function fillAlertForm(row) {
    document.querySelector("#alertId").value = row.id || "";
    document.querySelector("#alertTitle").value = row.title || "";
    document.querySelector("#alertMessage").value = row.message || "";
    document.querySelector("#alertButton").value = row.button_label || "";
    document.querySelector("#alertView").value = row.view || "my";
    document.querySelector("#alertPriority").value = row.priority ?? 5;
    document.querySelector("#alertActive").checked = Boolean(row.active);
    els.alertStatus.textContent = "Editing selected alert.";
    els.alertsPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetAlertForm() {
    els.alertForm.reset();
    document.querySelector("#alertId").value = "";
    document.querySelector("#alertPriority").value = "5";
    document.querySelector("#alertActive").checked = true;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }
})();
