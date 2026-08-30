# CLAUDE.md — `admanager_frontend` (Earo Advertiser Dashboard)

> Strategy/domain context: `../../../CLAUDE.md` (Express vs Pro, campaign hierarchy, kill switch, personas). Cross-project map: `../../CLAUDE.md`.
> This file documents **the advertiser dashboard SPA code**. Its own `.git` (`github.com/dev-nbm/admanager_frontend`), separate from backend/landing/admin.

## What this is

The **advertiser-facing dashboard SPA** — the logged-in product where SMBs and agencies create ads, build campaigns, fund wallets, and view reports. This is the React app the parent CLAUDE.md §2 refers to as "Express + Pro mode toggled via `dashboardMode` state."

Distinguish it from its siblings:
- `earo_admin/` — the **internal** governance/BI/sync console (Earo staff). Different app, similar stack.
- `admanager_landing/` — the **pre-signup** Next.js marketing funnel + Magic Moment.
- `admanager_frontend/` (here) — the **post-signup** advertiser dashboard.

Scaffolded with **Lovable** (see `README.md`); the boilerplate README is Lovable's default and does not describe Earo specifics.

## Stack

Vite + React 18 + TypeScript, **bun** (`bun.lockb`; npm also works). shadcn/ui (Radix + Tailwind, `src/components/ui/`), TanStack Query for server state, `react-router-dom` v6, `ag-grid-react` for grids, `recharts` for charts, `wavesurfer.js` for audio waveforms, `react-hook-form` + `zod` for forms, `react-helmet-async` for head tags.

```bash
npm run dev          # vite dev server on port 8080
npm run build        # vite build → dist/  (build:dev for development mode)
npm run lint         # eslint
npm run preview      # serve dist on port 9000 --host
npm run serve:prod   # serve -s dist -l 9000
```

There are **no tests** in this repo (unlike `earo_admin`). Path alias `@` → `src/` (see `vite.config.ts`). `vite.config.ts` allowlists hosts `staging-app.earo.ai` / `app.earo.ai`.

## Architecture

### Talks to the gateway only
`src/services/api.ts` is the core fetch engine — same pattern as `earo_admin`. `BASE_URL = VITE_API_URL ?? http://localhost:3000` (the **Api_Gateway**, never internal services). It injects auth headers, normalizes errors (`request<T>()` returns `{ data, error, status, message }`), and handles **JWT refresh** via single-flight `refreshPromise` calling `POST /api/v1/auth/refresh`. Add new backend calls through a service module in `src/services/`, not raw `fetch`.

Per-domain service modules: `ads`, `advertiser`, `campaign`, `payment`, `wallet`, `organization`, `team`, `targeting`, `reports`, `geo`, `system`, `support`, `user`, `appNotifications`.

### Auth & session
`src/services/auth.ts` owns JWT storage (localStorage key `nextads_auth_session` + `js-cookie`) and an `onAuthStateChange` listener bus. Session carries `currentOrganizationId` / `currentAdvertiserId` and `app_metadata` (orgs, role, `isPro`, `isSuperAdmin`).

### Express vs Pro gating
Read persona flags via `useSessionFlags()` (`src/hooks/useSessionFlags.ts`) → `{ isPro, isNewUser, isAgency, isSuperAdmin, role }`, derived from `session.app_metadata` (falls back to `localStorage` dev flags `nextads_dev_flags`). `isPro` is true for agencies or Pro advertisers. Gate Pro-only fields with `const { isPro } = useSessionFlags()` — e.g. `CampaignSetupStep` hides the external campaign ID and `DashboardLayout` shows the advertiser selector only in Pro/Agency. This implements the field-gating table in parent CLAUDE.md §7.

### Server-Driven UI (SDUI)
`src/contexts/SDUIContext.tsx` fetches a backend **SDUI payload** (TanStack Query) controlling feature flags, A/B experiments, locale, defaults, and "nudges" — the dynamic component system in parent CLAUDE.md §18.6. A `FALLBACK_PAYLOAD` keeps the UI working when the backend is unavailable. Consume via `useSDUI`, `useFeatureFlag`, `useExperiment`, `useLocale`, `useDefaults`. `src/hooks/useUIConfig.ts` re-exports these for legacy back-compat. Renderers live in `src/components/sdui/` (`SDUIRenderer`, `NudgeManager`, and `blocks/` like `HeroBlock`, `ReachMapBlock`, `CheckoutBlock`, `AudioRevealBlock`).

### i18n + RTL
`src/contexts/TranslationContext.tsx` + `src/contexts/DirectionContext.tsx` provide translation and LTR/RTL direction (MENA → Arabic). Strings in `src/locale/{en,ar}.json`. shadcn is configured `"rtl": true` (`components.json`).

### Routing (`src/App.tsx`)
Public: `/` and `/login` (`Auth`), `/verifyEmail`, `/resetPassword/:token`, `/paymentSuccess`, `/paymentFailed`. Authenticated shell at `/dashboard` (`Dashboard` + `DashboardLayout`) with nested routes: index `DashboardHome`, `ads` / `ads/new` / `ads/:id` (`AdCreator`), `campaigns` / `campaigns/new` / `campaigns/:id` (`CampaignWizard`), `reports`, `account`, `support`. Pages are flat in `src/pages/`; feature components under `src/components/dashboard/`.

### Campaign Wizard
`src/components/dashboard/campaign-wizard/` mirrors the parent §7 step model: Setup → Schedule → Inventory → Targeting → Budget → AudienceExtension → Payment → Review, plus `ForecastSidebar` / `CampaignSummary` / `CampaignLaunchModal`. Express hides fields behind smart defaults; Pro exposes the full hierarchy. Remember the backend is the System of Record — the wizard never writes to AdsWizz; it posts to the gateway, which enqueues the Trigger-Sync job.

### Payments
MamoPay (UAE Express checkout) integrated via `src/lib/MamoPayHelper.ts` and `src/types/mamopay.d.ts`, surfaced in `CampaignPaymentStep` with `PaymentSuccess`/`PaymentFailed` redirect pages.

### Analytics
`src/lib/analytics.ts` — a batching behavioral-event client that posts funnel events to the backend (session/anon IDs, device, geo, UTM, experiment assignments). It is currently unused (no call sites beyond a couple of SDUI nudge events) — earmarked for a future internal BI/DB tool, not the active tracking layer.

**GTM (`src/lib/gtm.ts`) is the active tracking layer and Earo's source of truth for funnel/conversion events**, feeding GA4/Google Ads/Reddit. Container `GTM-NKZL36XK` is hardcoded in `index.html` (the app container — see the GTM/GA4 memory note; distinct from the landing container). `gtm.ts` is the only place this app writes to `window.dataLayer` — go through a `track*` helper there (`trackPurchase`, `trackSignUp`, `trackCreateAd`, etc.), never push to `dataLayer` directly from a component.

When building any new feature that represents a funnel-relevant user action (a new creation flow, payment/launch path, or account action), add a matching `track*` helper — and even when tracking isn't explicitly requested, call out what *could* be tracked so the user can decide. Two rules that matter more than they look:
- **Event names must match what's actually configured in the live GTM container.** Container config lives only in the Google console, not this repo — never invent a name and assume a tag exists for it. Verify by fetching the published container (`curl https://www.googletagmanager.com/gtm.js?id=GTM-NKZL36XK`, grep for candidate custom event-name strings) or ask the user to check the GTM UI. A mismatched name silently tracks nothing — this happened twice while building this convention.
- A string match in the fetched `gtm.js` is not proof a tag's *trigger* listens for that name as a Custom Event. A tag's own outbound GA4 event name (`vtp_eventName`) is a separate field from its trigger condition, and the trigger itself may be a native auto-event listener (e.g. Click Text matching a button's literal label) rather than `{{Event}}` equality against a `dataLayer` push. Decoding a trigger's `predicates` array (`arg0`/`arg1`/`function` fields) is the only way to confirm which mechanism is actually in use — when in doubt, ask the user to check the GTM UI directly rather than inferring from string presence alone.
- **Dedupe one-time events, not repeatable ones.** Entity-creation events that should fire once per new entity (e.g. `app_ad_generated`, `app_new_campaign`) use a `useRef` guard checked before firing and set immediately after. Repeatable actions (e.g. every "Save Draft" click, `app_save_draft`) fire undeduped, every time.

This app has no PostHog integration (see `admanager_landing` for that) — GTM/`dataLayer` is the only tracking layer here for now.

## Deploy

`.github/workflows/deploy-dev.yml` runs on push to the **`dev`** branch: SSH to the host → `git pull` → `npm ci || npm install` → `npm run build` → `pm2 restart frontend`. PM2-managed (`ecosystem.config.cjs`), not containerized. Default branch is `main`; create a branch before committing.

## Conventions

- Frontend talks to the **gateway only** (`/api/v1/...`). No direct AdsWizz or internal-service calls.
- New API access → a `src/services/*` module routed through `request()` in `api.ts`.
- Persona-gated UI → `useSessionFlags()`; backend-driven UI/flags/experiments → `useSDUI` & friends.
- shadcn primitives in `src/components/ui/` — extend rather than re-import Radix directly.
- Brand: primary `#36AB45` via Tailwind CSS vars (`tailwind.config.ts`, `src/index.css`).
