# Supabase Migration Notes

This adds Supabase as a parallel backend while Google Sheets remains the production source of truth.

## Current Project

- Supabase project: `Conference Guide AI`
- Project URL: `https://hjtyqkmjmilyitrmuief.supabase.co`
- Current mode: Supabase public reads enabled with Google Sheets fallback; Google Apps Script still handles email delivery and remains a safety fallback

## Phase 1: Mirror Writes

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase-schema.sql`.
3. In Supabase, copy the project URL and anon public key from Project Settings > API.
4. Update `lead-config.js`:

```js
window.NEHA_SUPABASE_CONFIG = {
  enabled: true,
  mirrorWrites: true,
  readFromSupabase: false,
  url: "https://hjtyqkmjmilyitrmuief.supabase.co",
  anonKey: "YOUR-PUBLISHABLE-KEY",
  communityImageBucket: ""
};
```

5. Deploy the app.
6. Test lead capture, demo request, trivia, free drink, community post, and schedule email.
7. Confirm each action still lands in Google Sheets and also appears in Supabase.

## Phase 2: Cut Over Carefully

`readFromSupabase` is now enabled for public app data such as alerts, leaderboards, community threads, session Q&A, drink ticket validation, and session presentations. Google Sheets/Apps Script remains in place as a fallback and for email delivery.

To fully remove Google Sheets/Apps Script, replace email delivery, YouTube podcast refresh, and any admin sheet workflows with Supabase Edge Functions or a small admin backend.
