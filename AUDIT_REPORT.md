# StreamVault — Comprehensive Audit Report

**Date:** 2026-06-24  
**Project:** `nextjs_tailwind_shadcn_ts` (StreamVault)  
**Audit Scope:** Full-stack Next.js 16 streaming platform with Supabase backend  

---

## SCORING SUMMARY

| Category | Score | Notes |
|---|---|---|
| **Architecture** | 72/100 | Mixed patterns but mostly coherent |
| **Security** | 65/100 | Several credential exposure issues |
| **Performance** | 70/100 | Good but missing optimization patterns |
| **Maintainability** | 68/100 | Inconsistent code style, too many disabled rules |
| **Scalability** | 40/100 | Major concerns with SQLite + N+1 queries |
| **Database** | 55/100 | Missing constraints, SQLite in prod path |
| **Frontend** | 78/100 | Clean components but a11y gaps |
| **Backend** | 70/100 | Good auth pattern, inconsistent error handling |
| **DevOps** | 35/100 | No Docker, no CI/CD, hardcoded secrets in scripts |
| **Testing** | 5/100 | No test files found at all |
| **Documentation** | 30/100 | No README, no API docs |
| **Overall** | **53/100** | Significant issues need addressing |

---

## CRITICAL ISSUES

### CRIT-1: Hardcoded Supabase Service Role Key in Scripts
**Severity:** 🔴 CRITICAL  
**Location:** `scripts/setup-banners.ts:15`, `scripts/setup-supabase.ts:15`  
**Root Cause:** The Supabase service role key (SUPABASE_SERVICE_KEY) is hardcoded as a string literal in two setup scripts. This key has full admin access to the database.  
**Risk:** If the repository is public or accessed by unauthorized persons, the entire database can be compromised. The key is `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqcmNrcm5tc3Bib2x2cnVqbW5mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjAzNDk1MywiZXhwIjoyMDk3NjEwOTUzfQ._osuy9lG__GMLd89Q8uhzuhT6b4kL-vqJaO-IhmvCHI`  
**Recommended Fix:** Remove hardcoded keys, use environment variables in all scripts.  
**Status:** ❌ NOT FIXED (requires secret rotation + removal)

### CRIT-2: Missing Database Migrations / Schema-as-Code
**Severity:** 🔴 CRITICAL  
**Location:** Project-wide  
**Root Cause:** The project uses SQL files scattered in `scripts/` directory and manual SQL execution via Supabase dashboard. No formal migration tooling. The Prisma schema exists but only defines `User` and `Post` models — completely unrelated to the actual Supabase tables being used (profiles, contents, episodes, etc.).  
**Risk:** Database schema drift, unable to reproduce database state, no rollback capability.  
**Recommended Fix:** Use Supabase migrations properly or migrate to Prisma with the actual schema. Delete the stale Prisma schema.

### CRIT-3: reactStrictMode: false
**Severity:** 🔴 CRITICAL  
**Location:** `next.config.ts`  
**Root Cause:** `reactStrictMode: false` disables React's strict mode, which means double-rendering bugs, outdated lifecycle warnings, and potential side-effect issues go undetected during development.  
**Risk:** Hidden bugs in effects, stale closures, memory leaks in production.  
**Recommended Fix:** Set `reactStrictMode: true` and fix any resulting warnings.

### CRIT-4: ignoreBuildErrors: true
**Severity:** 🔴 CRITICAL  
**Location:** `next.config.ts`  
**Root Cause:** `typescript: { ignoreBuildErrors: true }` suppresses ALL TypeScript errors during build.  
**Risk:** Type errors ship to production silently. This is extremely dangerous — nullable access, type mismatches, and API contract violations will not be caught.  
**Recommended Fix:** Remove this setting and fix all TypeScript errors.

### CRIT-5: SQLite Database URL in Production Path
**Severity:** 🔴 CRITICAL  
**Location:** `.env` — `DATABASE_URL=file:/home/z/my-project/db/custom.db`  
**Root Cause:** The project uses SQLite via Prisma for something (unclear what since the actual app uses Supabase), pointing to a hardcoded filesystem path.  
**Risk:** SQLite doesn't scale, crashes in serverless/edge, file path may not exist.  
**Recommended Fix:** Remove SQLite/Prisma dependency if not used, or migrate to Supabase fully.

---

## HIGH ISSUES

### HIGH-1: Missing CSRF Protection
**Severity:** 🟠 HIGH  
**Location:** All API routes  
**Root Cause:** No CSRF tokens or SameSite cookie enforcement on any API endpoints. The middleware passes through all requests.  
**Risk:** Cross-site request forgery attacks on authenticated users.  
**Recommended Fix:** Implement CSRF tokens or use Supabase's built-in CSRF protection. Add SameSite=Strict to auth cookies.

### HIGH-2: No Rate Limiting
**Severity:** 🟠 HIGH  
**Location:** All API routes, especially `/api/auth/*` and `/api/admin/*`  
**Root Cause:** No rate limiting on any endpoint. Login, register, and admin endpoints are unprotected.  
**Risk:** Brute-force password attacks, DoS on API, account enumeration.  
**Recommended Fix:** Add rate limiting (e.g., Vercel KV rate limits, upstash, or middleware-based).

### HIGH-3: Missing Input Validation on Public APIs
**Severity:** 🟠 HIGH  
**Location:** `/api/browse/route.ts`, `/api/search/route.ts`  
**Root Cause:** While `escapePostgrest()` is used for SQL injection prevention, there's no Zod validation on the API inputs — only string escaping.  
**Risk:** Unexpected input shapes could cause crashes or bypass filters.  
**Recommended Fix:** Add Zod validation schemas for all public API inputs.

### HIGH-4: Prisma Schema is Stale/Wrong
**Severity:** 🟠 HIGH  
**Location:** `prisma/schema.prisma`  
**Root Cause:** The Prisma schema defines `User` and `Post` models — completely unrelated to the actual streaming platform. The app uses Supabase tables directly.  
**Risk:** Confusion, dead code, someone might accidentally use Prisma for production queries.  
**Recommended Fix:** Remove Prisma entirely or align schema with actual database.

### HIGH-5: All ESLint Rules Disabled
**Severity:** 🟠 HIGH  
**Location:** `eslint.config.mjs`  
**Root Cause:** 30+ ESLint rules explicitly set to "off", including `no-unused-vars`, `no-console`, `prefer-const`, `react-hooks/exhaustive-deps`, `@typescript-eslint/*` rules.  
**Risk:** Code quality issues, unused variables, missing dependency arrays, potential bugs.  
**Recommended Fix:** Remove the blanket disable rules, enable key rules incrementally.

### HIGH-6: `isAuthenticated` variable used but not defined in PlayerClient
**Severity:** 🟠 HIGH  
**Location:** `src/app/(main)/watch/[contentId]/[episodeId]/PlayerClient.tsx:93`  
**Root Cause:** The `isAuthenticated` variable is referenced in the JSX (`isAuthenticated ? ...`) but is NOT destructured from `data` props. Only `isSubscriber` is destructured.  
**Risk:** Runtime crash when a non-authenticated user encounters a locked episode.  
**Recommended Fix:** Add `isAuthenticated` to the destructured props.

### HIGH-7: Watch History Not Actually Saving
**Severity:** 🟠 HIGH  
**Location:** PlayerClient.tsx, playerStore.ts  
**Root Cause:** The `playerStore` tracks playback position in memory only (Zustand). There's no API call to persist `watch_history` to Supabase when the user pauses or navigates away.  
**Risk:** Continue Watching feature on homepage relies on `watch_history` in DB, but nothing ever writes to it during playback.  
**Recommended Fix:** Add a server action or API call to upsert watch history on progress updates.

---

## MEDIUM ISSUES

### MED-1: `noImplicitAny: false` in tsconfig
**Severity:** ⚠️ MEDIUM  
**Location:** `tsconfig.json`  
**Root Cause:** TypeScript strict mode is on but `noImplicitAny` is explicitly set to false.  
**Risk:** Functions can have implicit `any` parameters, defeating type safety.  
**Recommended Fix:** Set `noImplicitAny: true` and fix resulting errors.

### MED-2: Duplicate Auth Logic in LoginForm and RegisterForm
**Severity:** ⚠️ MEDIUM  
**Location:** `LoginForm.tsx`, `RegisterForm.tsx`  
**Root Cause:** Both forms have nearly identical code for fetching profiles after auth, handling Google sign-in, and updating the auth store. This is duplicated ~80 lines.  
**Recommended Fix:** Extract shared auth handling into a custom hook `useAuthHandler()`.

### MED-3: Google OAuth Redirect Uses Client-Side `window.location`
**Severity:** ⚠️ MEDIUM  
**Location:** `LoginForm.tsx:93-97`, `RegisterForm.tsx:91-95`  
**Root Cause:** The Google OAuth flow redirects via `window.location.href = data.url`. This causes a full page navigation that loses React state.  
**Risk:** Potential race condition, less reliable than server-side redirect.  
**Recommended Fix:** Use `window.location.assign()` or handle via server action with redirect.

### MED-4: No 404 Pages
**Severity:** ⚠️ MEDIUM  
**Location:** Project-wide  
**Root Cause:** No `not-found.tsx` or `error.tsx` files exist in the app directory.  
**Risk:** Default Next.js 404 page shown to users — no branded experience.  
**Recommended Fix:** Create custom 404 and error pages.

### MED-5: No Loading States on Server Components (except Suspense)
**Severity:** ⚠️ MEDIUM  
**Location:** ContentDetailPage, PlayerPage  
**Root Cause:** Server component data fetching has no error boundary. If a fetch fails, the entire page crashes with no user feedback.  
**Recommended Fix:** Add error boundaries (`error.tsx`) at every route segment.

### MED-6: `crypto.subtle` Used in Server-Side Encryption
**Severity:** ⚠️ MEDIUM  
**Location:** `src/lib/crypto/encryption.ts`  
**Root Cause:** `crypto.subtle` is a Web Crypto API available in browsers and Node 19+. In older Node/edge runtimes it might not be available or behave differently.  
**Risk:** Potential runtime error in certain server environments.  
**Recommended Fix:** Use Node's `crypto` module (with `webcrypto`) for server-side encryption to ensure consistency.

### MED-7: N+1 Query for Category-Based Content on Homepage
**Severity:** ⚠️ MEDIUM  
**Location:** `src/app/(main)/page.tsx:160-175`  
**Root Cause:** After fetching categories, the code loops through categories and makes sequential Supabase queries for each one: `for (const cat of categoriesRes.data.slice(0, 3)) { await supabase.from("contents")... }`  
**Risk:** 3 extra round trips to the database, increased homepage load time.  
**Recommended Fix:** Use `Promise.all()` to fetch category content in parallel.

### MED-8: No SEO Metadata on Dynamic Pages
**Severity:** ⚠️ MEDIUM  
**Location:** `src/app/(main)/watch/[contentId]/page.tsx`, `src/app/(main)/watch/[contentId]/[episodeId]/page.tsx`  
**Root Cause:** Dynamic content pages have no `generateMetadata()` function.  
**Risk:** Poor SEO for the most important pages (content detail, player).  
**Recommended Fix:** Add `generateMetadata()` that fetches content title/description.

### MED-9: Error States Missing on Watch/Player Pages
**Severity:** ⚠️ MEDIUM  
**Location:** PlayerClient.tsx, ContentDetailClient.tsx  
**Root Cause:** No dedicated error state UI for iframe load failures or missing episodes.  
**Risk:** Users see blank screen or generic browser error if player fails.  
**Recommended Fix:** Add error state with retry button and fallback messaging.

### MED-10: No Accessible Labels on Icon-Only Buttons
**Severity:** ⚠️ MEDIUM  
**Location:** Several components  
**Root Cause:** Buttons with only icons (e.g., scroll arrows, X buttons, eye toggle) sometimes lack `aria-label`.  
**Risk:** Screen reader users can't interact with the UI.  
**Recommended Fix:** Add `aria-label` to all icon-only buttons.

---

## LOW ISSUES

### LOW-1: Magic Strings for Type Icons
**Severity:** ℹ️ LOW  
**Location:** `ContentDetailClient.tsx`, `PlayerClient.tsx` — `TYPE_ICONS`  
**Root Cause:** The `TYPE_ICONS` mapping is duplicated across two files instead of being in `constants.ts`.  
**Recommended Fix:** Move to `src/lib/constants.ts`.

### LOW-2: Unused Dependencies
**Severity:** ℹ️ LOW  
**Location:** `package.json`  
**Root Cause:** Several packages may be unused:
- `@prisma/client` / `prisma` — Prisma schema exists but app uses Supabase directly
- `pg` — PostgreSQL client installed but app uses Supabase SDK
- `next-auth` — installed but auth uses Supabase Auth, not NextAuth
- `@reactuses/core` — installed but not imported anywhere visible
**Recommended Fix:** Audit and remove unused dependencies.

### LOW-3: `slug` Generation Collision Risk
**Severity:** ℹ️ LOW  
**Location:** `src/lib/admin/content-actions.ts`  
**Root Cause:** Slug is generated from title with simple regex but no uniqueness check or collision handling.  
**Recommended Fix:** Add unique constraint on slug and handle collisions (append random suffix).

### LOW-4: Console.log Statements in Production (from eslint override)
**Severity:** ℹ️ LOW  
**Location:** Project-wide  
**Root Cause:** ESLint has `no-console: off`, and there are `console.log` statements in production code (`AuthInitializer.tsx:55`, `content-actions.ts` error logging).  
**Recommended Fix:** Remove console.logs from production code or use a proper logger.

### LOW-5: `dangerouslySetInnerHTML` Not Used but No Markdown Sanitization
**Severity:** ℹ️ LOW  
**Location:** `react-markdown` dependency present  
**Root Cause:** `react-markdown` is installed but no markdown content is rendered anywhere visible. If used in future, needs sanitization.  
**Recommended Fix:** Add `rehype-sanitize` plugin if react-markdown is used for user content.

### LOW-6: Hardcoded Error Messages
**Severity:** ℹ️ LOW  
**Location:** Various API routes  
**Root Cause:** Error messages like "Failed to fetch content", "Forbidden", "Something went wrong" are hardcoded strings.  
**Recommended Fix:** Create an error message constants file.

---

## TECHNICAL DEBT

### T1: Dead Architecture — Prisma Layer
Prisma is set up with User/Post models completely unrelated to the actual streaming app. The `db.ts` file exports PrismaClient but nothing imports it. The `.env` file has a SQLite `DATABASE_URL`. This appears to be leftover from a previous template/project.

**Action:** Delete Prisma schema, db.ts, remove prisma/pg dependencies.

### T2: Dead Code — Prisma `db.ts`
`src/lib/db.ts` exports a PrismaClient with logging enabled. Not used anywhere in the app. It's dead code.

**Action:** Remove the file and its dependency.

### T3: Two Auth Paths — Client + Server Actions
Authentication flows through two different paths:
1. **Client forms** (LoginForm, RegisterForm): Direct `supabase.auth.signInWithPassword()` call from client.
2. **Server actions** (`signUp`, `signIn` in `auth/actions.ts`): Server-side auth.

The server actions `signUp` and `signIn` in `src/lib/auth/actions.ts` are defined but never called by any component — the forms use client-side Supabase calls directly.

**Action:** Remove unused server actions or migrate forms to use them.

### T4: Massive ESLint Config
30+ rules disabled. This means all TypeScript/React best practices are essentially opt-in rather than enforced. New developers can introduce bugs without detection.

**Action:** Remove the overrides and fix issues incrementally.

### T5: `setVolume` Sets Negative Values
In `playerStore.ts`, `setVolume: (volume) => set({ volume, isMuted: volume === 0 })` doesn't clamp volume to `[0, 1]`. Also sets isMuted when volume is 0, which is fine, but setMuted doesn't restore volume.

---

## FINDINGS BY COMPONENT

### IsAuthenticated Undefined Bug (CONFIRMED)
**File:** `src/app/(main)/watch/[contentId]/[episodeId]/PlayerClient.tsx`  
**Line:** ~93  
**Issue:** 
```tsx
const { episode, content, episodes, categories, isSubscriber, embedUrl, isIframe } = data;
```
`isAuthenticated` is NOT destructured from `data`, but on line ~93 it's used:
```tsx
{isAuthenticated ? (
```
This will cause a **runtime ReferenceError**. The `data` object passed from the server page DOES include `isAuthenticated`.

### Missing Empty State Directory
No `not-found.tsx` or global `error.tsx` exists.

### Category Query on Homepage is Sequential
```typescript
for (const cat of categoriesRes.data.slice(0, 3)) {
  const { data: catContent } = await supabase.from("contents")...
```
This makes 3 sequential DB round-trips. Should use `Promise.all()`.

---

## SCORES DETAIL

| Category | Score | Justification |
|---|---|---|
| **Architecture (72)** | Good folder separation, Server/Client components, Zustand stores. But dead Prisma layer, two auth paths, mixed patterns lower the score. |
| **Security (65)** | AES-256-GCM for credentials, `escapePostgrest()` for injection. Hardcoded service key in scripts, no CSRF, no rate limiting, all ESLint security rules off. |
| **Performance (70)** | TanStack Query with good stale times, lazy loading images, Suspense boundaries. N+1 homepage query, sequential category fetches. |
| **Maintainability (68)** | Well-commented code, consistent naming. Too many disabled ESLint rules, no tests, no README, duplicate logic in Login/Register. |
| **Scalability (40)** | SQLite DATABASE_URL, N+1 queries, no caching layer, no rate limiting, no pagination on some endpoints. |
| **Database (55)** | Missing FK constraints, no unique constraints on tmdb_id, sequential loop queries, DELETE+INSERT pattern instead of UPSERT. |
| **Frontend (78)** | Clean components, good loading/error/empty states on browse/search. Missing a11y, no custom error/404 pages, inconsistent metadata. |
| **Backend (70)** | Clean API route separation, admin auth guard pattern. Missing validation on public APIs, inconsistent error response shapes. |
| **DevOps (35)** | No Docker, no CI/CD, Caddyfile for reverse proxy only, hardcoded secrets, no production readiness checks. |
| **Testing (5)** | Zero tests discovered anywhere in the project. |
| **Documentation (30)** | Worklog exists but no README, no API docs, no architecture overview, no setup instructions. |

---

## TOP 10 IMMEDIATE ACTIONS

1. **🔴 Rotate comprimised Supabase service role key** — Remove hardcoded key from scripts, rotate in Supabase dashboard
2. **🔴 Enable `reactStrictMode: true`** — Catch hidden React bugs
3. **🔴 Remove `ignoreBuildErrors: true`** — Fix all TypeScript errors
4. **🔴 Fix `isAuthenticated` undefined bug in PlayerClient** — Prevents runtime crash
5. **🟠 Remove hardcoded secrets from ALL script files**
6. **🟠 Add rate limiting to auth endpoints**
7. **🟠 Add proper database migrations** — Remove stale Prisma schema
8. **🟠 Implement CSRF protection**
9. **🟠 Add watch history persistence** — Make "Continue Watching" actually work
10. **🟠 Enable key ESLint rules** — Catch bugs during development

---

## CONCLUSION

StreamVault is a feature-rich streaming platform with a well-organized codebase and clean UI components. The architecture shows good separation of concerns (Server/Client components, Zustand stores, admin API guards). However, it suffers from several **critical security and configuration issues** inherited from its development history:

1. **The project was clearly scaffolded from a template** (Prisma User/Post models, next-auth, SQLite URL) but never fully cleaned up.
2. **Security shortcuts were taken** — hardest error suppression possible (`ignoreBuildErrors: true`), all ESLint rules disabled, hardcoded service keys in source files.
3. **No testing whatsoever** — 0 test files.

Despite these issues, the actual application code (components, API handlers, auth flows, UI) is well-written and follows modern Next.js patterns. With a focused cleanup effort (estimated 1-2 weeks), this could be a solid production application.

**The project is currently NOT production-ready** due to the CRITICAL issues identified above.
