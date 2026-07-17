<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# EduNexus / CollegeDost — Agent Instructions

## Project Overview
Junior College coaching management platform (EduNexus brand, CollegeDost repo) with three roles: Principal, Teacher, Mentor. Built on Next.js 15 + Firebase + Socket.io.

## Key Conventions

### File Structure
- **App Router** only (`src/app/**`) — no Pages Router
- **Server Components by default** — use `'use client'` only when needed
- **Path aliases**: `@/*` → `src/*`

### Type Safety
- **Strict TypeScript** — no `any`, use types from `src/types/index.ts`
- **Zod schemas** in `src/lib/validations.ts` for all forms/API
- **Firebase types** — extend `User` with `role`, `status`, `stream`

### State Management
- **Server state**: TanStack Query (React Query) — `src/providers/QueryProvider.tsx`
- **Client auth state**: React Context — `src/contexts/AuthContext.tsx`
- **Forms**: React Hook Form + Zod resolvers
- **Real-time**: Socket.io — `src/lib/socket/`

### Styling
- **Tailwind CSS v4** with CSS variables — `src/app/globals.css`
- **shadcn/ui** components in `src/components/ui/`
- **Stream colors**: MPC=Indigo, BiPC=Emerald, CEC=Amber
- **Dark mode**: `next-themes` with `class` strategy

### Firebase
- **Client**: `src/lib/firebase/config.ts` (safe for client components)
- **Admin**: `src/lib/firebase/admin.ts` (server-only, never import in client)
- **Auth**: HttpOnly session cookies via `src/lib/auth/session.ts`
- **Rules**: `firestore.rules` — deploy with `npm run db:rules`

### API Routes
- **Session**: `src/app/api/auth/session/route.ts` (create/verify/destroy)
- **Route handlers** in `src/app/api/**/route.ts`
- **Server Actions** preferred for mutations

### Middleware
- `middleware.ts` validates session cookie on protected routes
- Redirects unauthenticated → `/`, unauthorized role → `/unauthorized`

### Seeding
```bash
npm run seed:principal   # Creates principal user
npm run seed:defaults    # Streams, subjects, sections, schedule
```

## Coding Standards

### Do
- Use `cn()` from `src/lib/utils.ts` for className merging
- Define types in `src/types/index.ts` — export from there
- Use Server Actions for mutations (`'use server'`)
- Validate all inputs with Zod
- Use `sonner` for toasts (`toast.success/error`)

### Don't
- Import `firebase-admin` in client components
- Use `any` type — define proper interfaces
- Hardcode colors — use CSS variables from globals.css
- Mutate state directly — use React Query mutations
- Commit `.env.local` or service account keys

## Common Tasks

### Add a new page
1. Create `src/app/{role}/{feature}/page.tsx`
2. Add to `src/lib/constants.ts` nav items (`{ROLE}_NAV_ITEMS`)
3. Update sidebar if needed (`src/components/layout/Sidebar.tsx`)

### Add a new Firestore collection
1. Define type in `src/types/index.ts`
2. Add Zod schema in `src/lib/validations.ts`
3. Write Server Actions in `src/app/{role}/{feature}/actions.ts`
4. Create UI components
5. Update Firestore rules

### Add real-time event
1. Define payload in `src/lib/socket/events.ts`
2. Emit from server (`server.ts` or Server Action)
3. Listen in client component via `useSocket()`

## Environment
- **Node**: 20+
- **Package Manager**: npm (lockfile committed)
- **Port**: 3000 (configured in `server.ts`)

## Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Socket.io |
| `npm run next:dev` | Next.js only (no sockets) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run seed:principal` | Seed principal user |
| `npm run seed:defaults` | Seed default data |
| `npm run db:rules` | Deploy Firestore rules |