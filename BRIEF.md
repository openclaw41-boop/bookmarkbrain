# BookmarkBrain — Product Brief

## One-liner
"Stop saving bookmarks you'll never read. BookmarkBrain reads them for you."

## What it does
1. User pastes URLs or uploads a browser bookmarks HTML export file
2. AI reads each URL, generates: one-line summary, 3 key takeaways, category tag
3. Dashboard shows all bookmarks organized by AI-detected categories
4. User can search bookmarks with natural language
5. Free: 20 bookmarks. Paid ($29 lifetime): unlimited

## Tech Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 (using @tailwindcss/postcss)
- Convex for backend/DB (real-time, serverless)
- Google Gemini API for AI summaries (free tier, key: AIzaSyDxa8BZTnSOVwf8j3ZIWQOaY_CmZUtasqo)
- LemonSqueezy for payments (integrate later)
- Deploy on Vercel

## Pages
1. `/` — Landing page (hero, features, pricing, CTA)
2. `/app` — Main dashboard (requires auth)
3. `/app/import` — Import bookmarks (paste URLs or upload HTML)
4. `/api/summarize` — API route that calls Gemini to summarize a URL

## Convex Schema
- `bookmarks` table: userId, url, title, summary, takeaways (array), category, favicon, createdAt, status (pending/done/error)
- `users` table: email, plan (free/pro), bookmarkCount, createdAt

## Auth
- Simple email magic link via Convex Auth, or just use a client-side localStorage userId for V1 MVP (no auth needed initially — just let people use it)

## Landing Page Sections
1. Hero: "Your bookmarks are gathering dust. Let AI read them for you." + CTA button
2. How it works: 3 steps (Import → AI Reads → Browse & Search)
3. Features grid: AI Summaries, Smart Categories, Natural Language Search, Weekly Digest (coming soon)
4. Pricing: Free (20 bookmarks) / Pro $29 lifetime (unlimited)
5. Footer

## Design
- Dark mode by default, clean, minimal
- Accent color: electric blue (#3B82F6) or similar
- Font: Inter or system
- Inspired by: Linear, Raycast, Arc browser aesthetics
- Mobile responsive

## V1 Scope (MVP — this is what we build NOW)
- Landing page
- Paste URLs (textarea, one per line) → AI summarizes each
- Upload bookmarks HTML file → parse → AI summarizes
- Dashboard with category filters + search
- localStorage for V1 (no auth, no DB yet — pure client-side with API routes for AI)
- Deploy to Vercel

## NOT in V1
- User accounts / auth
- Convex DB (use localStorage first)
- Payment integration
- Browser extension
- Email digests
- X/Twitter bookmark import
