window.NEHA_LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbzfiOct307nr_6B85EC_KGbSyYrBAPUKlQj_Rvuy79-Wo22jaQ0EUBcNJTl3J1251M1/exec";
window.NEHA_SUPABASE_CONFIG = {
  enabled: true,
  mirrorWrites: true,
  readFromSupabase: true,
  url: "https://hjtyqkmjmilyitrmuief.supabase.co",
  anonKey: "sb_publishable_nxpbxkRa6G3gfLMca1fhig_Iqt3NDhs",
  communityImageBucket: "community-images",
  edgeEndpoint: "https://hjtyqkmjmilyitrmuief.supabase.co/functions/v1/app-api",
  adminEndpoint: "https://hjtyqkmjmilyitrmuief.supabase.co/functions/v1/app-api",
  edgeWrites: true,
  writeMode: "dual"
};

(function hardenConferenceGuideInputs() {
  const blockedCommunityPatterns = [
    /\bf+u*c+k+(?:e[rd])?s?\b/,
    /\bm+o+t+h+e+r+f+u+c+k+\w*\b/,
    /\bs+h+i+t+\b/,
    /\bc+u+n+t+\b/,
    /\bb+i+t+c+h+\b/,
    /\ba+s+s+h+o+l+e+s?\b/,
    /\bd+i+c+k+s?\b/,
    /\bc+o+c+k+s?\b/,
    /\bp+e+n+i+s+\b/,
    /\bp+u+s+s+y+\b/,
    /\bv+a+g+i+n+a+\b/,
    /\bb+l+o+w+j+o+b+s?\b/,
    /\bn+u+d+e+s?\b/,
    /\bp+o+r+n+\b/,
    /\bxxx\b/
  ];

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isValidEmail(value) {
    const email = normalizeEmail(value);
    if (!email || email.length > 254 || /\s/.test(email)) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return false;
    const [local, domain] = email.split("@");
    if (!local || !domain || local.length > 64) return false;
    if (domain.includes("..") || domain.startsWith(".") || domain.endsWith(".")) return false;
    return domain.split(".").every((part) => /^[a-z0-9-]+$/i.test(part) && !part.startsWith("-") && !part.endsWith("-"));
  }

  function setEmailValidity(input) {
    const email = normalizeEmail(input.value);
    input.setCustomValidity(email && !isValidEmail(email) ? "Please enter a complete email address like name@agency.gov." : "");
  }

  function hasBlockedCommunityContent(value) {
    const compact = String(value || "")
      .toLowerCase()
      .replace(/[@$!1|*._-]/g, "")
      .replace(/\s+/g, " ");
    return blockedCommunityPatterns.some((pattern) => pattern.test(compact));
  }

  function communityModerationMessage(values) {
    const text = values.map((value) => String(value || "")).join(" ");
    if (!text.trim()) return "";
    return hasBlockedCommunityContent(text)
      ? "Please keep Community Connect conference-friendly. Remove explicit language or sexual content before posting."
      : "";
  }

  function blockEvent(event, message, statusElement) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (statusElement) statusElement.textContent = message;
  }

  function installHardening() {
    const leadEmail = document.querySelector("#leadEmail");
    if (leadEmail) {
      leadEmail.setAttribute("inputmode", "email");
      leadEmail.setAttribute("pattern", "^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$");
      leadEmail.setAttribute("title", "Enter a complete email address like name@agency.gov");
      leadEmail.addEventListener("input", () => setEmailValidity(leadEmail));
    }

    document.querySelector("#leadForm")?.addEventListener("submit", (event) => {
      const email = document.querySelector("#leadEmail");
      if (!email) return;
      email.value = normalizeEmail(email.value);
      setEmailValidity(email);
      if (!isValidEmail(email.value) || !email.checkValidity()) {
        blockEvent(event, "", null);
        email.reportValidity();
      }
    }, true);

    document.querySelector("#communityForm")?.addEventListener("submit", (event) => {
      const message = communityModerationMessage([
        document.querySelector("#communityTitle")?.value,
        document.querySelector("#communityMessage")?.value,
        document.querySelector("#communityImageFile")?.files?.[0]?.name
      ]);
      if (message) blockEvent(event, message, document.querySelector("#communityStatus"));
    }, true);

    document.querySelector("#communityPosts")?.addEventListener("submit", (event) => {
      const form = event.target.closest(".community-reply-form");
      if (!form) return;
      const message = communityModerationMessage([form.querySelector("textarea")?.value]);
      if (message) blockEvent(event, message, form.querySelector(".community-reply-status"));
    }, true);

    document.querySelector("#imageViewerOpen")?.remove();
    const imageViewer = document.querySelector("#imageViewerModal");
    if (imageViewer && "MutationObserver" in window) {
      new MutationObserver(() => document.querySelector("#imageViewerOpen")?.remove())
        .observe(imageViewer, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", installHardening, { once: true });
  } else {
    installHardening();
  }
})();
