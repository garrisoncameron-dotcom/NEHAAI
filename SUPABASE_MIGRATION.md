# Supabase Migration Notes

This adds Supabase as a parallel backend while Google Sheets remains the production source of truth.

## Current Project

- Supabase project: `Conference Guide AI`
- Project URL: `https://hjtyqkmjmilyitrmuief.supabase.co`
- Current mode: Google Sheets primary, Supabase mirror writes enabled, Supabase reads disabled

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

Keep `readFromSupabase` set to `false` until the mirrored rows look right. Then move one public read at a time, starting with low-risk features such as app alerts and session presentations.

The Google Apps Script can stay in place for email delivery and operational fallback until Supabase has equivalent server-side functions.
