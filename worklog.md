---
Task ID: 1
Agent: Main
Task: Fix poster UI to vertical card layout, fix admin users page, create banner management system

Work Log:
- Changed ContentCard.tsx from 16:9 horizontal (aspect-video, backdrop_url) to 2:3 vertical poster (aspect-[2/3], poster_url preferred)
- Updated ContentCarousel.tsx card widths from 140-250px to 120-190px for vertical posters
- Updated browse page grid from 2-6 cols to 3-7 cols with vertical skeleton
- Updated search page grid from 2-6 cols to 3-7 cols with vertical skeleton
- Updated HomeSkeleton.tsx to use aspect-[2/3] instead of aspect-video
- Fixed admin users API: removed broken profiles→subscriptions join, now uses 2 separate queries + in-memory merge
- Updated admin users page to use flat response (subscription_status, subscription_tier, subscription_end)
- Created banners table SQL migration (00003_create_banners_table.sql)
- Created admin banners API (GET/POST/PATCH/DELETE) at /api/admin/banners with graceful table-missing handling
- Created public banners API at /api/banners with graceful degradation
- Created admin banner management page at /admin/banners with:
  - Content-based banners (pick from published content)
  - Custom promotional banners (any image URL + link)
  - Reorder, toggle active, edit, delete
  - Schedule (start/end date)
  - Shows SQL setup instructions when table doesn't exist
- Created BannerHero.tsx component for rendering both content and custom banners
- Updated homepage HeroBannerWrapper to check banners table first, fall back to featured content
- Added "Banners" link to AdminSidebar

Stage Summary:
- Poster cards are now vertical (2:3 portrait) across homepage, browse, and search pages
- Admin users page fixed - no more "Could not find relationship" error
- Banner management system fully built but requires SQL migration to be run in Supabase SQL Editor
- All pages compile and return 200 status

---
Task ID: 2
Agent: Main
Task: Full UI/UX cleanup and redesign for consistency

Work Log:
- **Design System (globals.css):**
  - Shifted all dark theme hues from 270 (purple) to 260 (neutral dark) for warmer, less purple tones
  - Stripped unused :root light mode CSS, kept minimal --radius
  - Added component-level input defaults (auto cinema-elevated bg, cinema-border, foreground color)
  - Added consistent :focus-visible red outline ring
  - Refined scrollbar colors to match new hue
  - Added ::selection with red tint
  - Added .page-enter animation utility
  - Improved cinema-gradient-card for better vertical poster readability (3-stop gradient)
  - Synced gradient utilities with new cinema-bg color

- **Navbar.tsx:**
  - CRITICAL FIX: Added missing Badge import (was causing runtime crash for authenticated users)
  - Replaced gradient fade header with clean solid blur: bg-cinema-bg/80 backdrop-blur-xl border-b
  - Removed separate absolute gradient overlay div
  - Logo: smaller (w-7 h-7), rounded-md, replaced glow-red with subtle shadow
  - Desktop nav: tighter gap, cleaner active state (text-white font-medium, no bg)
  - Search/auth buttons: rounded-full pill shape
  - Mobile sheet: backdrop-blur-xl, better padding, added account section label, user info at bottom
  - Dropdown: rounded-xl, rounded-lg items, better padding

- **MobileNav.tsx:**
  - Changed nav items: Home, Browse (was Drama), Search, My List, Profile
  - Replaced drop-shadow active glow with clean dot indicator
  - Cleaner container: bg-cinema-surface/90, border-cinema-border/50, h-14
  - Added tracking-wide to labels, font-semibold on active

- **Footer.tsx:**
  - 5-column grid: Brand | Browse | Account | Legal | Social
  - Replaced placeholder Company section with Legal and Social sections
  - Uppercase tracking-wider section headings (text-xs)
  - Better spacing: pt-16, space-y-3 links, mt-12 bottom bar
  - Added social icon buttons (Twitter, YouTube, Instagram)
  - Added tagline: "Made with ❤️ for movie lovers everywhere"

- **Auth Pages (LoginForm, RegisterForm, Auth Layout):**
  - Auth layout: larger/more subtle blur blobs (w-500px, blur-120px), added grid pattern overlay
  - Cards: rounded-2xl, generous padding (px-8 pt-8 pb-8)
  - All inputs: rounded-lg
  - Buttons: rounded-lg
  - Smaller separator text (text-[11px])

- **Admin Panel (AdminSidebar, AdminHeader, Dashboard):**
  - Sidebar: added tooltips for collapsed state (appears on hover)
  - Active nav: added left border indicator (red 2px bar)
  - Logo: smaller, replaced glow-red with subtle shadow
  - Collapse toggle: swapped to PanelLeftClose/Open icons
  - Mobile sheet: rounded-xl
  - AdminHeader: softer bg with blur, pill-shaped buttons
  - Dashboard stat cards: rounded-xl, hover border transition
  - Bar charts: rounded-full progress bars

- **ContentCarousel.tsx:**
  - Tighter section spacing (py-5, first:pt-2, gap-3.5)
  - Cleaner title (text-sm sm:text-base, tracking-tight)
  - "See All →" arrow indicator
  - Wider scroll arrow fade zones

- **Main Layout:**
  - Added pb-14 lg:pb-0 for mobile nav clearance

Stage Summary:
- All color tokens shifted from purple (hue 270) to neutral (hue 260)
- Navbar Badge import bug fixed (was causing crash for logged-in users)
- Navigation redesigned: cleaner Navbar, better MobileNav with Browse link, improved Footer
- Auth pages polished: rounded cards, better spacing, subtle background effects
- Admin panel polished: sidebar tooltips, consistent rounded corners, cleaner header
- Carousel sections improved: tighter spacing, arrow indicators
- All 9 key pages verified returning 200 status
- Consistent design language: rounded-xl cards, rounded-lg inputs/buttons, rounded-full pills