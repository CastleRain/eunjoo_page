# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## User direction, 2026-09-25
- Preserve ver1; build ver2 separately as a responsive internal web app prototype. The latest user direction supersedes green: white surfaces, very pale linen/beige, restrained warm brown accents.
- Use real Ant Design components for shared controls, tables, date selection, calendars, drawers and dialogs. Keep theme tokens centralized.
- Owner display name is 한승재. Hide owner management from staff navigation and search, and block its direct route. The production backend must enforce OWNER authorization independently of frontend visibility.
- Recommended production stack: React + TypeScript + Vite + Ant Design, NestJS + Prisma + PostgreSQL. The current JSX prototype has no backend; do not represent planned technology as already implemented.
- Keep clinic staff requirements as primary scope; use dr.pltt.cloud/manual as interaction inspiration, not added EMR/insurance scope.
- Support 40–50s with 18/20/22px display preferences, large controls, readable contrast and reduced motion.
- Add CRM + internal ERP employee leave flow: employee submits, owner approves/rejects, only approved leave appears in staff calendar. Pending cancellation remains until owner approval. No public sharing of leave reasons.
- Prototype only; no real patients, authentication, messages, payments or permanent business storage.

## Presentation and leave feedback, 2026-09-25
- Requested leave days must be derived from start/end, read-only; half-day leave is 0.5. The preview uses inclusive calendar days (weekends/holidays included), explicitly labelled until work schedules are connected.
- Provide a detailed presentation script and a built-in automatic walkthrough with pause, next, section selection, and stop/restore. Keep the existing design and all business flows. Use fake data only; never trigger real messaging, calls, payments or native printing from autoplay.

## Herb registration feedback, 2026-09-25
- Provide a clearly visible 새 약재 등록 action beside 입고 등록. Register herb name, optional supplier, automatic unique item code, and g base unit; start stock at zero and offer registration followed by intake. Reject duplicate names, preserve existing inventory flows, and include the flow in the automatic presentation.

## Repository and publishing direction, 2026-09-27
- Maintain one app at the repository root, based on the former ver2. This supersedes the earlier request to keep versioned app folders. Use Git history and branches for future versions.
- Public repository: CastleRain/eunjoo_page. Publish the frontend to GitHub Pages using .github/workflows/deploy.yml on main. Respect the /eunjoo_page/ base path, including downloadable public files.
- The original layout is archived in .local-backup/original-layout-2026-09-27.tar.gz and must remain excluded from Git.
- First publish the existing prototype; backend implementation is a subsequent phase. Keep the distinction between implemented React/Ant Design UI and planned authentication, APIs and database explicit.

## Approved redesign brief, 2026-09-27
- Follow the user's UI redesign template approval gates. Phase 0 brief and Phase 1 libraries are approved; the three implemented representative options must be presented for selection before expanding to all screens.
- Preserve all business state, data, callbacks, routes, role restrictions, and automatic walkthrough behavior. Scope the options to Today and Stock (including registration/intake), plus their shared shell and controls.
- Light mode only for these options, white/pale beige with warm brown accents. Preserve 18/20/22px controls and reduced motion.
- Approved libraries: existing Ant Design 6.6.5 theme and components, Lucide React 1.48.0, Motion 13.4.4, Fontsource Noto Sans KR Variable 5.3.0.
- Make three actual, independently committed option branches from pre-redesign-20260927. No main commit/merge/push until explicitly authorized. Do not change backend or hosting integration.

## Selected A refinement, 2026-09-27
- User selected layout A and explicitly replaced the beige/brown direction with white + warm gray. Avoid yellowish surfaces; use neutral charcoal for main actions, retaining semantic status colors.
- User requested a smaller, younger-feeling view as well as readable large-font modes. Default new users to compact 16px; retain existing saved preferences and 18/20/22px options. Compact mode adjusts spacing/table density as well as font size; large modes retain generous controls. Touch targets must remain usable.
- Proceed with Phase 4 on feature/ui-redesign-warm-gray from option A. Apply shared presentation consistently across all menus, preserve business behavior, and wait for review before any main merge/push/deployment.

## Soft brown refinement, 2026-09-27
- Latest user direction supersedes the warm-gray/charcoal palette: keep A layout and return to a lighter, softer brown for a clinic atmosphere. Keep white surfaces and avoid an overall yellow cast; use pale brown selected areas and restrained brown actions.
- Preserve compact 16px and existing 18/20/22px display preferences and density behavior. This update changes the shared color theme only; main merge/publishing still requires explicit authorization.

## Implementation approval and policy, 2026-09-27
- User approved proceeding after the proposed next step of finalizing the soft-brown design and updating the deployed main app. Main merge/push for this reviewed redesign is now authorized.
- Production authorization has two roles only: OWNER (representative/한승재) and STAFF. Desk/dispensing labels in the prototype are staff job examples, not separate production permission levels.
- Staff handle herb intake and material reservation. OWNER can also perform these operations. Owner business/finance views and leave decisions remain OWNER-only.
- Keep the current leave calculation: inclusive start/end calendar dates, including weekends and public holidays; morning/afternoon half-day is 0.5. Do not silently switch to business-day calculations. Retain approval/cancellation/calendar privacy rules.
- Proceed incrementally toward TypeScript and the planned NestJS/PostgreSQL/Prisma backend. Keep the publicly deployed prototype operational and clearly distinguish connected features from backend groundwork.

## Service foundation status, 2026-09-27
- Reviewed UI is published from main. Subsequent groundwork is on codex/service-foundation.
- TypeScript migration is incremental: entry/theme/design tokens and shared rules are typed; most business UI remains JSX. Run npm run typecheck, npm test and npm run build.
- server/ is an npm workspace with NestJS health-only API and Prisma PostgreSQL account/leave models. Run npm run db:validate, npm run build:api and npm run test:api for changes there. Use Node 22.12+ or Node 24 LTS.
- At the foundation commit, authentication, DB migrations/persistence and business API routes were not connected. See the later Supabase status below. Do not represent policy helpers as an enforced server security boundary or the health endpoint as database readiness.

## Supabase direction, 2026-09-27
- User chose GitHub Pages + Supabase Auth/PostgreSQL for shared online testing. This supersedes building custom NestJS session authentication as the immediate next step. Keep existing NestJS foundation for possible later server workflows; do not imply it is deployed or connected.
- Implement server-enforced OWNER/STAFF authorization with database policies and guarded transactional functions. Start with login and persisted leave requests/approval/calendar; preserve the current prototype and distinguish shared data from demo data.
- Never ship a Supabase service_role/secret key in frontend code. Use the project's public publishable key and verified DB access policies.
- User asked to register Supabase together and completed sign-in. In CastleRain's Org (Free), prepared a new ondam-workspace project in Seoul with Data API on, automatic table exposure off, automatic RLS on. User completed creation of ondam-workspace (jjxgyuhwlflhnhxragsn). Existing Yangjeong Coffee is unrelated and must not be modified. Work branch: codex/supabase-leave.

## Supabase implementation status, 2026-09-27
- Applied supabase/migrations/202609270001_leave.sql to the new remote project through SQL Editor. Private ondam tables have RLS and no direct authenticated access; guarded public RPCs enforce active membership and OWNER/STAFF rules.
- Added ?mode=live for Supabase login/persisted leave and kept the default prototype as demo. Local public config is ignored in .env.local. No secret/service-role key is used.
- SQL integration tests run in a disposable Docker PostgreSQL container: npm run test:supabase. Bootstrap fixture files must never be applied to the hosted project.
- First actual Auth users/profiles and browser end-to-end role tests are pending user account creation. Never treat dashboard login as an app account or infer OWNER from client metadata. GitHub Pages publication of this feature is pending verification.
