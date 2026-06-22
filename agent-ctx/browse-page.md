# Task: Build Public Browse / Catalog Page

## Files Created

### 1. `src/app/api/browse/route.ts`
- **GET** handler accepting query params: `type`, `category`, `sort`, `search`, `page`, `pageSize`
- Uses server-side Supabase client (`createClient` from `@/lib/supabase/server`)
- Filters to only `status = 'published'` content
- Supports type filtering, category filtering (via `content_categories` + `categories` join), full-text search on `title` and `original_title`, and three sort modes: `rating` (default, with `rating_count` tie-break), `newest` (by `published_at`), and `az` (alphabetical)
- Returns `{ data: Content[], count: number, error: string | null }`
- Selects only card-relevant fields: `id, title, type, poster_url, backdrop_url, release_year, rating, rating_count, is_premium_only, status`
- Handles category join rows by extracting only content fields from combined rows
- Proper error handling with 500 status codes

### 2. `src/app/(main)/browse/page.tsx`
- **Client component** wrapped in `<Suspense>` for `useSearchParams()` compatibility
- **Top bar**: "Browse" title with subtitle showing active type filter
- **Search bar**: Input with search icon, clear button, Enter-to-search, cinema-styled
- **Type filter pills**: All, Movie, Series, Anime, Donghua, Micro-Drama — active pill uses `cinema-red` background, inactive uses `cinema-surface` with `cinema-border`
- **Sort dropdown**: Top Rated, Newest, A—Z using shadcn Select
- **Content grid**: Responsive 2→6 column grid reusing existing `ContentCard` component
- **Result count**: Shows "X titles found" above grid
- **Pagination**: Previous/Next buttons with "Page X of Y" — scrolls to top on page change
- **Loading state**: Skeleton grid matching card dimensions + header skeletons
- **Empty state**: Search icon + contextual message
- **Error state**: Destructive text with error message
- **URL sync**: Deep-linking support — all filter changes update URL via `router.replace`
- **TanStack Query**: 2-minute stale time, query key includes all filters + page
- Uses cinema-* color tokens throughout (cinema-bg, cinema-surface, cinema-border, cinema-red, cinema-red-hover, cinema-muted, cinema-elevated)

### 3. `src/app/(main)/browse/[type]/page.tsx`
- **Server component** (async)
- Validates the `type` param against valid content types
- Redirects to `/browse?type={type}` for clean URL paths
- Invalid types redirect to `/browse` (shows all)

## Design Decisions
- Used a Suspense boundary wrapping `BrowseContent` to satisfy Next.js App Router requirements for `useSearchParams()`
- Created a dedicated `BrowsePageFallback` that matches the page structure (title, search bar, filter pills, grid skeletons)
- Category filtering uses inner join on `content_categories` and `categories` tables, with row extraction to handle the combined column set
- Pagination uses `count: "exact"` in Supabase for accurate total counts
- Removed unused `VALID_TYPES` import after lint review

## Lint Status
All 3 new files pass ESLint with zero errors/warnings. Pre-existing errors in `EpisodeManagerClient.tsx`, `AuthInitializer.tsx`, and `HeroBanner.tsx` are unrelated.