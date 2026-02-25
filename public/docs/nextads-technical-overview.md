# NextAds Self-Service DSP — Technical Overview

> **Version**: 1.0  
> **Last updated**: 2026-02-17  
> **Status**: Engineering-ready specification

---

## Table of Contents

1. [Toggle System Architecture](#1-toggle-system-architecture)
2. [State Matrix](#2-state-matrix)
3. [Page-by-Page Specifications](#3-page-by-page-specifications)
4. [Component Gating Rules](#4-component-gating-rules)
5. [Database Schema](#5-database-schema)
6. [Edge Functions](#6-edge-functions)
7. [Current Gaps & Mock Placeholders](#7-current-gaps--mock-placeholders)

---

## 1. Toggle System Architecture

### Context: `DevFlagsContext`

File: `src/contexts/DevFlagsContext.tsx`

Three development toggles control the entire dashboard experience. They are persisted in `localStorage` under the key `nextads_dev_flags`.

| Toggle | Key | Values | Default |
|---|---|---|---|
| Dashboard Mode | `dashboardMode` | `express` / `pro` | `express` |
| User State | `userState` | `new` / `existing` | `existing` |
| Pro Sub-Type | `proSubType` | `sme` / `agency` | `agency` |

**Important**: `proSubType` is only meaningful when `dashboardMode === 'pro'`. In Express mode it is ignored.

### Toggle UI

Toggles live in the sidebar's **Dev Tools** section (`DashboardLayout.tsx`, lines 127–158). The `proSubType` toggle is conditionally rendered only when `dashboardMode === 'pro'`.

When the sidebar is collapsed, labels are hidden and only `<Switch>` components are shown.

---

## 2. State Matrix

There are **6 meaningful state combinations** (3 toggles × 2 values, but `proSubType` is ignored in Express mode):

| # | Mode | User State | Pro Sub-Type | Result |
|---|---|---|---|---|
| 1 | Express | New | — | Onboarding CTAs, welcome card, no header action buttons |
| 2 | Express | Existing | — | Performance stats, campaign actions grid, header action buttons |
| 3 | Pro | New | SME | Onboarding CTAs + Pro campaign features (no advertiser selector) |
| 4 | Pro | New | Agency | Onboarding CTAs + Advertiser selector in header |
| 5 | Pro | Existing | SME | Full stats + Pro features (no advertiser selector) |
| 6 | Pro | Existing | Agency | Full stats + Advertiser selector + Advertisers tab in Account |

---

## 3. Page-by-Page Specifications

### 3.1 DashboardHome (`src/pages/DashboardHome.tsx`)

**Reads**: `isNewUser` from `useSessionFlags()`

| Condition | Rendered |
|---|---|
| `userState === 'new'` | Two CTA cards (Create Campaign, Create Audio Ad) + welcome "Get Started" card with 3-step guide |
| `userState === 'existing'` | 4 stat cards (Impressions, Spent, Reach, CPA) + `CampaignActionsGrid` |

**Data**: When `userState === 'existing'`, mock stats are used (`{ impressions: 124500, spend: 2340, reach: 48200 }`). When `new`, real data is fetched from the `campaigns` table.

### 3.2 DashboardLayout (`src/components/dashboard/DashboardLayout.tsx`)

**Reads**: `dashboardMode`, `userState`, `proSubType`

#### Header
- **Advertiser Selector**: Visible when `dashboardMode === 'pro' && proSubType === 'agency'`. Uses `MOCK_ADVERTISERS` array (Careem, Noon, Emirates NBD, Talabat, Kitopi).
- **Persistent CTAs** ("New Ad", "New Campaign"): Hidden when `location.pathname === '/dashboard' && userState === 'new'`. Shown on all other pages.

#### Sidebar
- Navigation: Dashboard, My Audio Ads, Campaigns, Reports
- Footer: My Account link, user email, Sign Out
- Dev Tools section with toggles (see §1)

### 3.3 CampaignWizard (`src/pages/CampaignWizard.tsx`)

**Reads**: `dashboardMode` → `isPro = dashboardMode === 'pro'`

#### Section Order

| Express Mode | Pro Mode |
|---|---|
| 1. Your Ad (Setup) | 1. Your Ad (Setup) |
| 2. Schedule | 2. Schedule |
| 3. Budget | 3. Budget |
| 4. Location (Inventory) | 4. Location (Inventory) |
| 5. Audience (Targeting) | 5. Audience (Targeting) |
| 6. Payment | 6. Audience Extension |

**Key differences in Pro mode:**
- `CampaignPaymentStep` is **hidden** (Pro is postpaid)
- `AudienceExtensionStep` is **added** after Audience targeting
- `CampaignTargetingStep` renders additional fields in Pro mode (gender select, age-range checkboxes, device-type checkboxes, day/time parting grid, podcast topic filters)

#### Progressive Disclosure
Sections are revealed sequentially as prerequisites are completed. Completed sections auto-collapse with a summary line. Scroll-to-section uses the `main` element as scroll parent.

#### Step Components

| Component | File | Pro-only features |
|---|---|---|
| `CampaignSetupStep` | `campaign-wizard/CampaignSetupStep.tsx` | External Campaign ID field |
| `CampaignScheduleStep` | `campaign-wizard/CampaignScheduleStep.tsx` | Day/Time parting grid |
| `CampaignInventoryStep` | `campaign-wizard/CampaignInventoryStep.tsx` | Multi-country support |
| `CampaignTargetingStep` | `campaign-wizard/CampaignTargetingStep.tsx` | Gender, Age, Device selectors |
| `CampaignBudgetStep` | `campaign-wizard/CampaignBudgetStep.tsx` | — |
| `CampaignPaymentStep` | `campaign-wizard/CampaignPaymentStep.tsx` | Express only |
| `AudienceExtensionStep` | `campaign-wizard/AudienceExtensionStep.tsx` | Pro only: banner upload, impression pixel |
| `ForecastSidebar` | `campaign-wizard/ForecastSidebar.tsx` | Sticky sidebar with live estimates |
| `CampaignSummary` | `campaign-wizard/CampaignSummary.tsx` | Review summary |

### 3.4 Account (`src/pages/Account.tsx`)

**Reads**: `dashboardMode`, `proSubType`

```
const isPro = dashboardMode === 'pro';
const isAgency = isPro && proSubType === 'agency';
```

#### Tabs

| Tab | Condition | Content |
|---|---|---|
| Profile | `!isPro` (Express only) | Personal info, password change |
| Users | `isPro` | `UsersTab` — team member management |
| Advertisers | `isAgency` | `AdvertisersTab` — multi-advertiser management |
| Company | Always | Company details, referral code, language, newsletter |
| Tracking | Always | Conversion pixel configuration (placeholder) |
| Billing | Always | Nested sub-tabs: Prepaid (always), Postpaid (agency only) |

**Tab grid**: `grid-cols-5` when `isAgency`, otherwise `grid-cols-4`.

**Default tab**: `isPro ? 'users' : 'profile'`

#### Billing Sub-tabs
- **Prepaid**: Spend/paid stats, payment methods (mock Visa 4242), coupons, payment history table
- **Postpaid** (agency only): Credit limit progress, invoices table, net terms display

### 3.5 Reports (`src/pages/Reports.tsx`)

**No toggle gating** — same for Express and Pro.

Features:
- Campaign selector dropdown (single or "All Campaigns")
- KPI stat cards: Impressions, Reach, Spend, Avg LTR, Conversions, Budget Utilization, CPA
- Granularity selector: Daily / Weekly / Monthly / Custom date range
- Multi-metric chart with per-metric toggle (Bar / Line / Off)
- Breakdown charts: Top Shows, Content Types, Device Types, Gender, Age Groups, Podcast Topics, Podcast Audiences, Locations
- Time-of-day heatmap
- AG-Grid data table with CSV export
- Uses mock data generated via seeded random for deterministic results

### 3.6 AdCreator (`src/pages/AdCreator.tsx`)

**Reads**: `dashboardMode` → `isPro`

| Feature | Express | Pro |
|---|---|---|
| Mode Switcher (AI / Upload) | Hidden (AI only) | Visible |
| Upload tab (`UploadAdForm`) | Hidden | Available |
| Pro Voice Settings | Hidden | Full voice config (language, accent, gender, use case, characteristics, age) |
| Pro Music Settings | Hidden | Full music config (use case, mood, genre, instrument, rhythm) |
| Pro Content Settings | Hidden | Fade in/out, start/end time, volume |
| Tracking Pixel | Hidden | Input field |

### 3.7 AdsLibrary (`src/pages/AdsLibrary.tsx`)

**No toggle gating** — same for Express and Pro.

Features:
- Summary stat cards (Total Ads, Impressions, Spend, Conversions)
- Search and status filter
- AG-Grid performance table with play/pause, delete, inline stats
- CSV export
- Empty state with CTA to create ad

### 3.8 CampaignsList (`src/pages/CampaignsList.tsx`)

Campaign listing page with status-based views.

---

## 4. Component Gating Rules

Quick reference for all conditionally rendered elements:

| Component / Element | Condition | Location |
|---|---|---|
| Advertiser Selector (header) | `dashboardMode === 'pro' && proSubType === 'agency'` | DashboardLayout header |
| Header CTAs (New Ad, New Campaign) | `pathname !== '/dashboard' \|\| userState === 'existing'` | DashboardLayout header |
| Onboarding CTAs | `userState === 'new'` | DashboardHome |
| Welcome Card | `userState === 'new'` | DashboardHome |
| Performance Stats | `userState === 'existing'` | DashboardHome |
| CampaignActionsGrid | `userState === 'existing'` | DashboardHome |
| Profile tab | `!isPro` | Account |
| Users tab | `isPro` | Account |
| Advertisers tab | `isPro && proSubType === 'agency'` | Account |
| Postpaid billing sub-tab | `isPro && proSubType === 'agency'` | Account > Billing |
| Payment step | `!isPro` | CampaignWizard |
| Audience Extension step | `isPro` | CampaignWizard |
| Pro targeting fields | `isPro` | CampaignTargetingStep |
| Mode Switcher (AI/Upload) | `isPro` | AdCreator |
| Pro customization panels | `isPro` | AdCreatorForm |
| ProSubType toggle | `dashboardMode === 'pro'` | DashboardLayout sidebar |

---

## 5. Database Schema

> All tables live in the `public` schema. Every table has RLS enabled.

---

### 5.1 `ads`

Audio ad creatives — the core content asset.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | Yes | — | Owner (references `auth.users`) |
| `product_name` | `text` | No | — | Product or brand being advertised |
| `brand_name` | `text` | Yes | — | Display brand name |
| `brand_data` | `jsonb` | Yes | — | Scraped/AI brand analysis payload |
| `prompt` | `text` | Yes | — | User-provided generation prompt |
| `script` | `text` | Yes | — | Generated or manual ad script |
| `audio_url` | `text` | Yes | — | URL to generated audio file |
| `job_id` | `text` | Yes | — | Wondercraft job reference |
| `status` | `text` | Yes | `'completed'` | `draft`, `processing`, `completed`, `failed` |
| `source_type` | `text` | Yes | `'manual'` | `manual`, `ai`, `upload` |
| `source_url` | `text` | Yes | — | Original source URL if uploaded |
| `tone` | `text` | Yes | `'friendly'` | Voice tone |
| `emphasis` | `text` | Yes | `'brand'` | What the ad emphasizes |
| `ai_target_audience` | `text` | Yes | — | AI-suggested target audience |
| `ai_category` | `text` | Yes | — | AI-suggested IAB category |
| `duration_seconds` | `numeric` | Yes | — | Audio length in seconds |
| `voice_settings` | `jsonb` | Yes | — | Language, accent, gender, age, characteristics |
| `content_settings` | `jsonb` | Yes | — | Fade, volume, timing overrides |
| `music_settings` | `jsonb` | Yes | — | Genre, mood, instrument, rhythm |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |
| `updated_at` | `timestamptz` | Yes | `now()` | Last modification time |

**RLS Policies**: Public access — any user can SELECT, INSERT, UPDATE, DELETE (open table for landing page demo flow).

**Triggers**: `update_ads_updated_at` — sets `updated_at = now()` before UPDATE.

---

### 5.2 `campaigns`

Campaign records linking an ad creative to schedule, budget, and targeting.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | Campaign owner |
| `ad_id` | `uuid` | No | — | FK → `ads.id` |
| `name` | `text` | No | — | Campaign display name |
| `campaign_type` | `text` | No | — | `one_off` or `weekly_recurring` |
| `status` | `text` | No | `'draft'` | `draft`, `pending`, `active`, `paused`, `completed` |
| `budget` | `numeric` | No | — | Total budget amount |
| `currency` | `text` | Yes | `'USD'` | ISO 4217 currency code |
| `start_date` | `date` | No | — | Campaign start |
| `end_date` | `date` | No | — | Campaign end |
| `target_locations` | `jsonb` | Yes | `'[]'` | Array of geo targets |
| `estimated_impressions` | `integer` | Yes | — | Forecasted impressions |
| `estimated_reach` | `integer` | Yes | — | Forecasted unique listeners |
| `actual_impressions` | `integer` | Yes | `0` | Delivered impressions |
| `actual_spend` | `numeric` | Yes | `0` | Amount spent to date |
| `reach` | `integer` | Yes | `0` | Actual unique listeners |
| `ltr` | `numeric` | Yes | — | Listen-through rate |
| `audience_package_id` | `text` | Yes | — | Selected audience package |
| `audience_package_name` | `text` | Yes | — | Audience package label |
| `dsp_partner` | `text` | Yes | `'adswizz'` | DSP integration partner |
| `dsp_campaign_id` | `text` | Yes | — | External campaign ID at DSP |
| `dsp_sync_status` | `text` | Yes | `'pending'` | `pending`, `synced`, `error` |
| `dsp_last_sync_at` | `timestamptz` | Yes | — | Last DSP sync timestamp |
| `created_at` | `timestamptz` | No | `now()` | Row creation time |
| `updated_at` | `timestamptz` | No | `now()` | Last modification time |

**CHECK constraints**: `campaign_type` IN (`one_off`, `weekly_recurring`); `status` IN (`draft`, `pending`, `active`, `paused`, `completed`).

**Foreign Keys**: `ad_id` → `ads.id`

**RLS Policies**: Owner-only — SELECT, INSERT, UPDATE, DELETE all require `auth.uid() = user_id`.

---

### 5.3 `ad_groups`

Targeting groups within a campaign — each links a creative to audience criteria.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `campaign_id` | `uuid` | No | — | FK → `campaigns.id` |
| `creative_id` | `uuid` | No | — | FK → `ads.id` |
| `user_id` | `uuid` | No | — | Owner |
| `gender` | `text` | Yes | `'all'` | Target gender filter |
| `age_range` | `jsonb` | Yes | `'["18-65"]'` | Age bracket array |
| `device_types` | `jsonb` | Yes | `'["all"]'` | Device filter array |
| `geo_data` | `jsonb` | Yes | `'[]'` | Geographic targeting data |
| `interests` | `jsonb` | Yes | `'[]'` | Interest-based targeting |
| `inventory_types` | `jsonb` | Yes | `'["streaming"]'` | `streaming`, `podcast`, `radio` |
| `podcast_topics` | `jsonb` | Yes | `'[]'` | Topic-based podcast targeting |
| `day_parting` | `jsonb` | Yes | — | Day/hour delivery schedule grid |
| `created_at` | `timestamptz` | No | `now()` | Row creation time |
| `updated_at` | `timestamptz` | No | `now()` | Last modification time |

**Foreign Keys**: `campaign_id` → `campaigns.id`; `creative_id` → `ads.id`

**RLS Policies**: Owner-only — SELECT, INSERT, UPDATE, DELETE all require `auth.uid() = user_id`.

---

### 5.4 `ad_collections`

Shareable collections of ads (e.g. for client review links).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `name` | `text` | No | — | Collection name |
| `description` | `text` | Yes | — | Optional description |
| `share_token` | `text` | No | `encode(gen_random_bytes(16), 'hex')` | Unique public share token |
| `expires_at` | `timestamptz` | Yes | — | Optional expiry for share link |
| `created_at` | `timestamptz` | No | `now()` | Row creation time |
| `updated_at` | `timestamptz` | No | `now()` | Last modification time |

**RLS Policies**: Public access — SELECT, INSERT, UPDATE, DELETE open to all.

---

### 5.5 `ad_collection_items`

Join table linking ads to collections with ordering.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `collection_id` | `uuid` | No | — | FK → `ad_collections.id` |
| `ad_id` | `uuid` | No | — | FK → `ads.id` |
| `sort_order` | `integer` | No | `0` | Display order within collection |
| `created_at` | `timestamptz` | No | `now()` | Row creation time |

**Foreign Keys**: `collection_id` → `ad_collections.id`; `ad_id` → `ads.id`

**RLS Policies**: Public SELECT, INSERT, DELETE. No UPDATE.

---

### 5.6 `user_profiles`

Extended user data created automatically on signup via trigger.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | — | PK, matches `auth.users.id` |
| `email` | `text` | Yes | — | User email (copied from auth) |
| `first_name` | `text` | Yes | — | First name |
| `last_name` | `text` | Yes | — | Last name |
| `phone` | `text` | Yes | — | Phone number |
| `company_name` | `text` | Yes | — | Company name |
| `company_type` | `text` | Yes | `'sme'` | `sme`, `agency`, etc. |
| `industry` | `text` | Yes | — | Business industry |
| `language` | `text` | Yes | `'en'` | Preferred UI language |
| `account_type` | `text` | Yes | `'express'` | `express`, `pro`, `agency` |
| `onboarding_state` | `text` | Yes | `'landing'` | `landing`, `captured`, `activated`, `paying` |
| `referral_code` | `text` | Yes | `gen_random_uuid()::text` | Unique referral code |
| `referred_by` | `uuid` | Yes | — | FK → `user_profiles.id` (self-referential) |
| `locale` | `jsonb` | Yes | `'{"country":"US","currency":"USD","language":"en"}'` | Locale preferences |
| `newsletter_opt_in` | `boolean` | Yes | `true` | Marketing consent |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |
| `updated_at` | `timestamptz` | Yes | `now()` | Last modification time |

**CHECK constraints**: `account_type` IN (`express`, `pro`, `agency`); `onboarding_state` IN (`landing`, `captured`, `activated`, `paying`).

**Foreign Keys**: `referred_by` → `user_profiles.id`

**RLS Policies**: Owner-only — SELECT, INSERT, UPDATE require `auth.uid() = id`. No DELETE.

---

### 5.7 `user_roles`

RBAC role assignments. Roles are stored separately from profiles to prevent privilege escalation.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | FK → `auth.users.id` |
| `role` | `app_role` | No | — | Enum: `admin`, `manager`, `member`, `viewer` |
| `organization_id` | `uuid` | Yes | — | Optional org scope |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |

**RLS Policies**: Owner SELECT only (`auth.uid() = user_id`). No INSERT, UPDATE, DELETE from client (admin-only via service role).

---

### 5.8 `user_states`

Tracks user lifecycle state transitions (visitor → lead → activated → paying).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | Yes | — | Authenticated user (nullable for anon) |
| `anonymous_id` | `text` | Yes | — | Client-generated anonymous ID |
| `current_state` | `text` | No | `'NEW_VISITOR'` | Current lifecycle state |
| `previous_state` | `text` | Yes | — | State before last transition |
| `state_entered_at` | `timestamptz` | Yes | `now()` | When current state was entered |
| `metadata` | `jsonb` | Yes | `'{}'` | Arbitrary state metadata |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |
| `updated_at` | `timestamptz` | Yes | `now()` | Last modification time |

**RLS Policies**: Public INSERT and UPDATE. SELECT requires `auth.uid() = user_id` or `user_id IS NULL`. No DELETE.

---

### 5.9 `payments`

Payment records for campaign purchases.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | Payer |
| `campaign_id` | `uuid` | Yes | — | FK → `campaigns.id` |
| `amount` | `numeric` | No | — | Payment amount |
| `currency` | `text` | No | `'USD'` | ISO 4217 code |
| `status` | `text` | Yes | `'pending'` | `pending`, `completed`, `failed`, `refunded` |
| `payment_method` | `text` | Yes | — | e.g. `visa`, `mastercard`, `apple_pay` |
| `mamopay_payment_id` | `text` | Yes | — | MamoPay external payment ID |
| `mamopay_checkout_url` | `text` | Yes | — | MamoPay checkout redirect URL |
| `receipt_url` | `text` | Yes | — | Receipt download link |
| `paid_at` | `timestamptz` | Yes | — | When payment was confirmed |
| `refunded_at` | `timestamptz` | Yes | — | When refund was processed |
| `refund_amount` | `numeric` | Yes | — | Partial or full refund amount |
| `metadata` | `jsonb` | Yes | — | Additional payment metadata |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |
| `updated_at` | `timestamptz` | Yes | `now()` | Last modification time |

**CHECK constraints**: `status` IN (`pending`, `completed`, `failed`, `refunded`).

**Foreign Keys**: `campaign_id` → `campaigns.id`

**RLS Policies**: Owner INSERT and SELECT (`auth.uid() = user_id`). No UPDATE or DELETE from client.

---

### 5.10 `credits`

Credit ledger for referral bonuses, promos, and refunds.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | No | — | Credit owner |
| `type` | `text` | No | — | `referral_earned`, `referral_used`, `promo`, `refund` |
| `amount_usd` | `numeric` | No | — | Credit value in USD |
| `source_user_id` | `uuid` | Yes | — | Referrer who triggered the credit |
| `campaign_id` | `uuid` | Yes | — | FK → `campaigns.id` (if applied to a campaign) |
| `expires_at` | `timestamptz` | Yes | — | Credit expiration date |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |

**CHECK constraints**: `type` IN (`referral_earned`, `referral_used`, `promo`, `refund`).

**Foreign Keys**: `campaign_id` → `campaigns.id`

**RLS Policies**: Owner SELECT only (`auth.uid() = user_id`). No INSERT, UPDATE, DELETE from client.

---

### 5.11 `events`

Analytics event stream for funnels, attribution, and experiment analysis.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `event_name` | `text` | No | — | Event identifier (e.g. `page_view`, `ad_created`) |
| `event_version` | `text` | Yes | `'v1'` | Schema version for the event |
| `session_id` | `text` | No | — | Client session identifier |
| `user_id` | `uuid` | Yes | — | Authenticated user (nullable for anon) |
| `anonymous_id` | `text` | Yes | — | Client anonymous ID |
| `properties` | `jsonb` | No | `'{}'` | Event-specific payload |
| `experiment_assignments` | `jsonb` | Yes | — | Active experiment variants at event time |
| `device_type` | `text` | Yes | — | `mobile`, `desktop`, `tablet` |
| `geo_country` | `text` | Yes | — | ISO country code |
| `geo_city` | `text` | Yes | — | City name |
| `referrer` | `text` | Yes | — | HTTP referrer |
| `utm_source` | `text` | Yes | — | UTM source tag |
| `utm_medium` | `text` | Yes | — | UTM medium tag |
| `utm_campaign` | `text` | Yes | — | UTM campaign tag |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |

**RLS Policies**: Public INSERT. Owner SELECT only (`auth.uid() = user_id`). No UPDATE or DELETE.

**Triggers**: `notify_new_event` — fires `pg_notify('new_event', ...)` after INSERT for real-time event pipeline.

---

### 5.12 `experiments`

A/B test configuration and lifecycle.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `name` | `text` | No | — | Experiment name |
| `description` | `text` | Yes | — | What is being tested |
| `hypothesis` | `text` | Yes | — | Expected outcome |
| `status` | `text` | Yes | `'draft'` | `draft`, `running`, `paused`, `completed` |
| `variants` | `jsonb` | No | `'[]'` | Array of variant definitions |
| `traffic_percentage` | `numeric` | Yes | `100` | % of traffic enrolled |
| `targeting_rules` | `jsonb` | Yes | `'{}'` | Audience targeting filters |
| `primary_metric` | `text` | No | — | Main success metric |
| `secondary_metrics` | `text[]` | Yes | — | Additional metrics to track |
| `guardrail_metrics` | `text[]` | Yes | — | Safety metrics |
| `exclusion_groups` | `text[]` | Yes | — | Mutually exclusive experiment groups |
| `started_at` | `timestamptz` | Yes | — | When experiment went live |
| `ended_at` | `timestamptz` | Yes | — | When experiment concluded |
| `change_log` | `jsonb` | Yes | `'[]'` | Audit trail of modifications |
| `created_by` | `uuid` | Yes | — | User who created the experiment |
| `updated_by` | `uuid` | Yes | — | User who last modified |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |
| `updated_at` | `timestamptz` | Yes | `now()` | Last modification time |

**CHECK constraints**: `status` IN (`draft`, `running`, `paused`, `completed`).

**RLS Policies**: Public SELECT. No INSERT, UPDATE, DELETE from client (admin-only).

---

### 5.13 `experiment_exposures`

Records which users/sessions were exposed to which experiment variants.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `experiment_id` | `uuid` | Yes | — | FK → `experiments.id` |
| `variant_id` | `text` | No | — | Which variant was shown |
| `anonymous_id` | `text` | No | — | Client anonymous ID |
| `session_id` | `text` | No | — | Session when exposed |
| `user_id` | `uuid` | Yes | — | Authenticated user (if any) |
| `exposed_at` | `timestamptz` | Yes | `now()` | Exposure timestamp |
| `converted` | `boolean` | Yes | `false` | Whether user converted |
| `converted_at` | `timestamptz` | Yes | — | Conversion timestamp |
| `conversion_event` | `text` | Yes | — | Event name that triggered conversion |

**Foreign Keys**: `experiment_id` → `experiments.id`

**RLS Policies**: Public INSERT. SELECT requires `auth.uid() = user_id` or `user_id IS NULL`. No UPDATE or DELETE.

---

### 5.14 `computed_defaults`

Smart defaults computed from aggregate user behavior per segment.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `segment_key` | `text` | No | — | Segment identifier (e.g. `country:AE`) |
| `default_type` | `text` | No | — | What default this provides (e.g. `budget`, `duration`) |
| `value` | `jsonb` | No | — | The computed default value |
| `sample_size` | `integer` | No | — | Number of data points used |
| `confidence_score` | `numeric` | Yes | — | Statistical confidence (0–1) |
| `previous_value` | `jsonb` | Yes | — | Previous default for comparison |
| `computed_at` | `timestamptz` | Yes | `now()` | When the computation ran |
| `valid_until` | `timestamptz` | Yes | — | Expiry for this default |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |

**RLS Policies**: Public SELECT only. No INSERT, UPDATE, DELETE from client.

---

### 5.15 `nudge_impressions`

Tracks display and interaction with in-app nudges/prompts.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `nudge_id` | `text` | No | — | Nudge configuration ID |
| `channel` | `text` | No | — | Where nudge was shown (`banner`, `modal`, `tooltip`) |
| `user_id` | `uuid` | Yes | — | Authenticated user |
| `anonymous_id` | `text` | Yes | — | Anonymous visitor ID |
| `shown_at` | `timestamptz` | Yes | `now()` | When nudge was displayed |
| `clicked` | `boolean` | Yes | `false` | Whether CTA was clicked |
| `clicked_at` | `timestamptz` | Yes | — | Click timestamp |
| `dismissed` | `boolean` | Yes | `false` | Whether nudge was dismissed |
| `dismissed_at` | `timestamptz` | Yes | — | Dismissal timestamp |

**RLS Policies**: Public INSERT and UPDATE. SELECT requires `auth.uid() = user_id` or `user_id IS NULL`. No DELETE.

---

### 5.16 `system_alerts`

Dashboard notification banners (global or per-user).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `title` | `text` | No | — | Alert title |
| `message` | `text` | No | — | Alert body text |
| `alert_type` | `text` | No | `'info'` | `info`, `warning`, `error`, `success` |
| `user_id` | `uuid` | Yes | — | Target user (null = global) |
| `is_global` | `boolean` | No | `false` | Whether alert shows for all users |
| `dismissed` | `boolean` | No | `false` | Whether user dismissed the alert |
| `expires_at` | `timestamptz` | Yes | — | Auto-expiry timestamp |
| `created_at` | `timestamptz` | No | `now()` | Row creation time |

**RLS Policies**: SELECT for global alerts OR own alerts (`is_global = true OR auth.uid() = user_id`). Owner UPDATE only. No INSERT or DELETE from client.

---

### 5.17 `ui_configs`

Server-driven UI (SDUI) configuration — controls which blocks render on each screen.

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `screen_id` | `text` | No | — | Screen identifier (e.g. `landing`, `dashboard`) |
| `layout` | `text` | Yes | `'express'` | Layout variant |
| `blocks` | `jsonb` | No | `'[]'` | Ordered array of UI block definitions |
| `features` | `jsonb` | Yes | `'{}'` | Feature flags for this screen |
| `locale_overrides` | `jsonb` | Yes | `'{}'` | Per-locale content overrides |
| `targeting_rules` | `jsonb` | Yes | `'{}'` | Audience targeting for this config |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |
| `updated_at` | `timestamptz` | Yes | `now()` | Last modification time |

**RLS Policies**: Public SELECT only. No INSERT, UPDATE, DELETE from client.

---

### 5.18 `landing_leads`

Captures from the landing page demo flow (email + optional brand info).

| Column | Type | Nullable | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | No | `gen_random_uuid()` | Primary key |
| `email` | `text` | No | — | Lead email address |
| `phone` | `text` | Yes | — | Phone number |
| `brand_name` | `text` | Yes | — | Brand or business name |
| `brand_url` | `text` | Yes | — | Brand website URL |
| `generated_audio_url` | `text` | Yes | — | Demo audio generated for this lead |
| `geo_data` | `jsonb` | Yes | — | Geo-location at capture time |
| `user_id` | `uuid` | Yes | — | Linked auth user (after signup) |
| `converted_to_user` | `boolean` | Yes | `false` | Whether lead signed up |
| `created_at` | `timestamptz` | Yes | `now()` | Row creation time |

**RLS Policies**: Public INSERT. Owner SELECT and UPDATE (`auth.uid() = user_id`). No DELETE.

---

### 5.19 Enumerations

#### Postgres Enum Type

| Enum | Values |
|---|---|
| `app_role` | `admin`, `manager`, `member`, `viewer` |

#### Inline CHECK Constraints

| Table.Column | Allowed Values |
|---|---|
| `user_profiles.account_type` | `express`, `pro`, `agency` |
| `user_profiles.onboarding_state` | `landing`, `captured`, `activated`, `paying` |
| `campaigns.campaign_type` | `one_off`, `weekly_recurring` |
| `campaigns.status` | `draft`, `pending`, `active`, `paused`, `completed` |
| `payments.status` | `pending`, `completed`, `failed`, `refunded` |
| `experiments.status` | `draft`, `running`, `paused`, `completed` |
| `credits.type` | `referral_earned`, `referral_used`, `promo`, `refund` |

---

### 5.20 Database Functions

| Function | Signature | Language | Security | Description |
|---|---|---|---|---|
| `has_role` | `(uuid, app_role) → boolean` | SQL | `SECURITY DEFINER` | Checks if a user has a given role. Used in RLS policies to avoid recursive lookups. |
| `handle_new_user` | `() → trigger` | PL/pgSQL | `SECURITY DEFINER` | Fires on `auth.users` INSERT. Creates a `user_profiles` row with the new user's `id` and `email`. |
| `notify_new_event` | `() → trigger` | PL/pgSQL | — | Fires after INSERT on `events`. Sends a `pg_notify('new_event', ...)` payload for real-time event pipeline. |
| `update_ads_updated_at` | `() → trigger` | PL/pgSQL | — | Generic trigger function that sets `NEW.updated_at = now()`. |

---

### 5.21 Triggers

| Trigger | Table | Event | Timing | Function |
|---|---|---|---|---|
| `on_auth_user_created` | `auth.users` | INSERT | AFTER | `handle_new_user()` |
| `update_ads_updated_at` | `ads` | UPDATE | BEFORE | `update_ads_updated_at()` |
| `notify_new_event` | `events` | INSERT | AFTER | `notify_new_event()` |

---

## 6. Edge Functions

| Function | Path | Purpose |
|---|---|---|
| `geo-detect` | `/functions/v1/geo-detect` | Returns country/city from request IP for auto-filling campaign location |
| `wondercraft` | `/functions/v1/wondercraft` | TTS audio generation via Wondercraft API |
| `analyze-brand` | `/functions/v1/analyze-brand` | AI brand analysis and script generation from URL or description |
| `analyze-ad-content` | `/functions/v1/analyze-ad-content` | Analyzes uploaded audio for categorization |
| `translate` | `/functions/v1/translate` | Translates UI strings for i18n |
| `ui-config` | `/functions/v1/ui-config` | Returns server-driven UI configuration (SDUI blocks) |
| `events` | `/functions/v1/events` | Ingests analytics events |
| `experiment-exposure` | `/functions/v1/experiment-exposure` | Records A/B test exposures |
| `recommend-music` | `/functions/v1/recommend-music` | Suggests background music for ads |
| `support-chat` | `/functions/v1/support-chat` | AI-powered support chat |
| `adswizz` | `/functions/v1/adswizz` | DSP integration with AdsWizz |

---

## 7. Current Gaps & Mock Placeholders

These items are implemented as mocks/placeholders and require real backend integration:

| Area | Current State | Required Work |
|---|---|---|
| **Multi-tenancy (Agency)** | `MOCK_ADVERTISERS` hardcoded array in DashboardLayout | Real `organizations` / `advertisers` table with user-org mapping, RLS scoping by org |
| **Payment (MamoPay)** | Payment fields exist in DB (`mamopay_payment_id`, `mamopay_checkout_url`) but no integration | MamoPay API integration, webhook handler, payment status polling |
| **DSP Integration** | `dsp_campaign_id`, `dsp_partner`, `dsp_sync_status` columns exist but unused | AdsWizz / Triton API integration for campaign submission and reporting sync |
| **Conversion Tracking** | Placeholder UI ("No conversion events configured yet") | Pixel event creation, JavaScript snippet generator, event ingestion endpoint |
| **Audio Generation** | Calls `analyze-brand` edge function | Full Wondercraft TTS pipeline with status polling, audio storage |
| **Postpaid Billing** | Mock credit limit ($50,000) and invoice table | Real invoicing system, credit limit management, payment terms |
| **Prepaid Billing** | Mock payment history and methods | Real payment processor integration, receipt generation |
| **Performance Stats** | Mock data when `userState === 'existing'` | Real aggregation from campaign delivery data |
| **Reports Data** | Seeded random mock data generation | Real impression/reach/conversion data from DSP reporting API |
| **User Roles** | `user_roles` table exists, `has_role()` function exists | Enforce role-based access in UI and API, invitation flow |
| **Referral System** | `referral_code` stored, `referred_by` column exists | Referral tracking, credit issuance on conversion |
| **Smart Defaults** | `computed_defaults` table exists | Background job to compute segment-based defaults |
| **Audience Extension** | UI exists in Pro mode | Banner ad serving integration, impression pixel validation |

---

## Appendix: Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui |
| State | React Context (DevFlags, Direction, Translation, SDUI) |
| Data Grid | AG-Grid Community |
| Charts | Recharts |
| Routing | React Router v6 |
| Backend | API service (replace with your backend) |
| Deployment | Lovable Cloud |
