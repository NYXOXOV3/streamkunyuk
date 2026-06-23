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