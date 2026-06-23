# Conference Navigator Admin Guide

This repo is the production template for HS GovTech conference guide apps. NEHA AEC 2026 is the first live instance.

## Operating Model

The public app remains a static website. Non-technical updates are managed through Google Sheets, with Google Apps Script acting as the lightweight backend.

Recommended early-stage pattern:

1. Clone the repo for each conference.
2. Create a fresh Google Sheet for that conference.
3. Deploy a fresh copy of `google-apps-script-leads.gs`.
4. Put that Apps Script Web App URL in `lead-config.js`.
5. Replace schedule, city, venue, and branding assets.
6. Deploy the cloned repo to GitHub Pages or Cloudflare Pages.

This gives every event its own isolated app, data, leads, and sponsor placements.

## Current Google Sheet Tabs

### App Alerts

Controls the alert cards shown near the top of the app.

Columns:

- `Active`: `Yes`, `True`, `1`, or `Active` shows the alert. Anything else hides it.
- `Label`: short category label, such as `Trivia Prize`, `Sponsor`, or `Lunch`.
- `Title`: main alert headline.
- `Message`: alert body text.
- `Button Text`: call-to-action label.
- `Destination`: one of `schedule`, `my`, `ai`, `kc`, `venue`, `podcast`, `trivia`, `demo`, or `drink`.
- `Starts At`: optional start date/time.
- `Ends At`: optional end date/time.
- `Sort Order`: lower numbers appear first.

The app shows up to four active alerts. If no sheet alerts are available, the built-in fallback alerts still show.

### NEHA Leads

Stores first-visit lead capture:

- name
- agency
- email
- capture time
- page/source metadata

### Demo Requests

Stores "Book a Demo" submissions:

- name
- agency
- email
- phone
- state
- notes
- request time

### Trivia Scores

Stores every completed trivia round:

- display name
- full name
- agency
- email
- score
- total
- achievement
- hints used
- completion time

The leaderboard is generated from this tab.

## Sponsored Alert Placements

App Alerts can be sold or packaged as sponsor inventory. Good sponsored alert formats:

- booth traffic: "Visit Booth 314 for a giveaway"
- timed promotion: "Sponsor coffee break starts at 10:30"
- demo invitation: "See the five-minute inspection workflow demo"
- partner spotlight: "Featured partner session at 2 PM"
- prize activation: "Complete the trivia challenge for a booth prize"

Suggested guardrails:

- Keep messages short enough to scan on a phone.
- Use clear destinations that already exist in the app.
- Avoid more than two sponsor alerts at the same time.
- Use start/end times for time-sensitive promotions.
- Put paid placements in `Sort Order` intentionally so they appear where promised.

## Next Configurable Sheet Tabs

These are strong candidates for future sheet-backed admin control without changing the user experience:

- `Kansas City Places`: name, category, description, walking time, URL.
- `Podcast Episodes`: title, YouTube URL, thumbnail, description, publish date.
- `Featured Sessions`: session ID, feature label, priority.
- `Venue Resources`: map image URL, caption, tab label.
- `App Copy`: configurable prize, demo, free drink, and sponsor messaging.

Schedule data can stay file-based for now. For urgent changes, add a future `Schedule Overrides` tab rather than asking marketing users to edit the full schedule JSON.

## New Conference Clone Checklist

Before launch:

- Rename the app in `index.html`, `manifest.webmanifest`, and any visible copy.
- Replace logos and app icons in `assets/`.
- Replace `data/sessions.json`.
- Replace or update `data/guide.json`.
- Replace venue maps and captions.
- Create the new conference Google Sheet.
- Deploy a new Apps Script Web App.
- Update `lead-config.js` with the new endpoint.
- Trigger the `alerts` feed once to create the `App Alerts` tab.
- Test lead capture, demo requests, trivia score posting, leaderboard loading, and alerts.
- Push to the event repo and verify the live URL on phone-sized viewports.

After launch:

- Export or copy leads from the Sheet.
- Archive sponsor alert performance notes manually.
- Clone the repo again for the next event rather than reusing the live conference instance.
