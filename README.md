# Little Notes 🐰

> *Future you will thank you for this.*

A cute, reliable reminder app made for Trang. Installable on iPhone, Android, Windows and Mac from a single link (PWA), no app store, and 100% free to run.

- **Reminders** with phone notifications, flexible repeats (daily, weekly, monthly, yearly for birthdays, and "day after each class"), snooze, and **keep reminding until done**.
- **To-do list** with steps, **notes**, **calendar** view, categories with pastel colors and stickers.
- **English + Tiếng Việt** side by side, or one at a time.
- **Morning summary**, streaks that unlock stickers, a celebration when something gets done.
- **Backup**: export/import JSON, export to iPhone Calendar (`.ics` with real alarms).
- **Idea box**: she can send suggestions straight to Luis.

## Project layout

```
app/      Vite + Preact + TypeScript PWA (what Trang installs)   → Cloudflare Pages
worker/   Cloudflare Worker + D1 + cron (sends the notifications) → Cloudflare Workers
```

The app works fully offline on its own. The worker exists only to fire push notifications at the right time and to receive ideas.

## Run locally

```bash
npm install
npm run dev            # app on http://localhost:5173
npm run worker:dev     # worker on http://localhost:8787 (needs .dev.vars, see below)
```

`worker/.dev.vars` (not committed):

```
APP_SECRET=choose-a-secret
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
```

Generate VAPID keys once with `cd worker && npm run vapid`.

## Deploy (all free tier)

### 1. Worker (notifications)

```bash
cd worker
npx wrangler login
npx wrangler d1 create little-notes          # copy the database_id into wrangler.toml
npm run db:init                               # creates the tables
npm run vapid                                 # prints the two keys
npx wrangler secret put VAPID_PUBLIC_KEY
npx wrangler secret put VAPID_PRIVATE_KEY
npx wrangler secret put APP_SECRET            # the code Trang will type in the app
npm run deploy                                # → https://little-notes-api.<you>.workers.dev
```

Edit `VAPID_SUBJECT` in `wrangler.toml` to your email. After the Pages site exists, set `ALLOWED_ORIGIN` to its URL.

### 2. App (Cloudflare Pages)

In the Cloudflare dashboard → Workers & Pages → Create → Pages → connect this GitHub repo:

| Setting | Value |
| --- | --- |
| Root directory | `app` |
| Build command | `npm install && npm run build` |
| Build output directory | `dist` |
| Environment variable | `VITE_API_URL` = your worker URL |

Every push to `main` publishes the app at `https://little-notes.pages.dev` (or similar).

### 3. Install on Trang's phone

Send her the link and the `APP_SECRET`.

- **iPhone**: open the link in Safari → Share → **Add to Home Screen** → open Little Notes from the home screen → Me → Notifications → enter the server URL + secret → allow notifications. (iOS 16.4+ required; notifications only work when the app is opened from the home screen icon.)
- **Android**: open in Chrome → "Install app" → same steps in Me → Notifications.
- **Windows / Mac**: open in Chrome or Edge → install icon in the address bar.

She can also export an `.ics` from Me → Backup and import it into the iPhone Calendar for alarms that ring even in silent mode.

## Reading the idea box

```bash
curl -H "authorization: Bearer $APP_SECRET" -H "x-device: luis" https://little-notes-api.<you>.workers.dev/ideas
```

## Notes for development

- Data lives in the browser (IndexedDB via Dexie). Nothing personal is stored on the server except reminder titles/times and push subscriptions.
- Stickers are original SVGs in `app/src/components/Stickers.tsx`.
- Texts live in `app/src/i18n/index.ts` (English and Vietnamese).
- Icons are generated from `app/public/icons/icon.svg` with `node scripts/icons.mjs`.
