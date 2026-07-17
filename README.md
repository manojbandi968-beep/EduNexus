# EduNexus (CollegeDost) — Junior College Coaching Management Platform

A production-ready coaching management platform for Junior Colleges — manage academics, attendance, quizzes, timetables, and performance analytics in one unified platform.

---

## 🚀 Features

### Role-Based Dashboards
- **Principal** — Full administrative control: teachers, students, subjects, sections, timetables, attendance oversight, leave approvals, announcements, audit logs, reports, campus map
- **Teacher** — Timetable, attendance marking, quiz management, leave requests, announcements, campus navigation
- **Mentor** — Study hour attendance, session logging, announcements, campus map

### Core Modules
- **Attendance** — Geofenced check-in, late/absent tracking, mentor study-hour logging
- **Timetable** — Visual grid builder, substitution management, stream/section-aware scheduling
- **Quizzes** — Create, conduct, auto-grade, leaderboards, performance analytics
- **Leave Management** — Request/approve/reject workflow with type-based limits
- **Announcements** — Role/stream-targeted notices with expiration
- **Campus Map** — Interactive floor plans, room navigation
- **Reports & Analytics** — Attendance trends, quiz performance, teacher metrics
- **Audit Logs** — Immutable action trail for compliance

### Technical Stack
- **Framework**: Next.js 15 (App Router, React Compiler, Turbopack)
- **UI**: Tailwind CSS v4 + shadcn/ui + Radix UI + Framer Motion
- **Auth**: Firebase Auth (Google OAuth) + HttpOnly session cookies
- **Database**: Cloud Firestore (real-time listeners)
- **Backend**: Firebase Admin SDK (server actions, middleware)
- **Real-time**: Socket.io (attendance, notifications)
- **Validation**: Zod + React Hook Form
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod resolvers

---

## 📦 Quick Start

### Prerequisites
- Node.js 20+
- Firebase project (Auth + Firestore enabled)
- Google Cloud Console project (for OAuth)

### Installation

```bash
# Clone and install
git clone <repo-url>
cd collegedost
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API Key | ✅ |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `project.firebaseapp.com` | ✅ |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `project.appspot.com` | ✅ |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | ✅ |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web App ID | ✅ |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Service account JSON (stringified) | ✅ |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JavaScript API key | ✅ |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g., `http://localhost:3000`) | ✅ |
| `SESSION_SECRET` | 32+ char random string | ✅ |
| `PRINCIPAL_EMAIL` | Initial principal email | ✅ |
| `PRINCIPAL_PASSWORD` | Initial principal password | ✅ |
| `PRINCIPAL_SECURITY_PIN` | 6-digit PIN for principal actions | ✅ |

### Firebase Setup

1. **Authentication** → Enable Google provider
2. **Firestore** → Create database (start in test mode, secure later)
3. **Service Account** → Project Settings → Service Accounts → Generate Private Key
4. **Authorized Domains** → Add `localhost`, your production domain

### Run Development

```bash
npm run dev          # Runs on http://localhost:3000 (with socket.io server)
# OR
npm run next:dev     # Next.js only (no socket.io)
```

### Production Build

```bash
npm run build
npm run start        # Runs production server with socket.io
```

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (auth, session)
│   ├── principal/         # Principal dashboard pages
│   ├── teacher/           # Teacher dashboard pages
│   ├── mentor/            # Mentor dashboard pages
│   ├── globals.css        # Global styles + Tailwind v4 theme
│   └── layout.tsx         # Root layout + providers
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Sidebar, TopBar, DashboardLayout
│   ├── auth/              # Login dialogs
│   ├── profile/           # Profile dialogs
│   └── campus/            # Campus map components
├── contexts/
│   └── AuthContext.tsx    # React context for auth state
├── lib/
│   ├── auth/              # Firebase auth helpers, session, RBAC
│   ├── firebase/          # Firebase client/admin config
│   ├── socket/            # Socket.io client/server events
│   ├── constants.ts       # App constants (streams, nav, colors)
│   ├── validations.ts     # Zod schemas
│   ├── utils.ts           # Utility functions (cn, formatters)
│   └── data-store.ts      # In-memory cache for dev
├── providers/
│   └── QueryProvider.tsx  # TanStack Query provider
├── scripts/
│   ├── seed-principal.ts  # Seed initial principal
│   └── seed-defaults.ts   # Seed streams, subjects, sections
└── types/
    └── index.ts           # TypeScript type definitions
```

---

## 🔐 Authentication Flow

1. User clicks **Google Sign-In** (Teacher/Mentor) or **Email/Password** (Principal)
2. Firebase Auth returns ID token → sent to `/api/auth/session`
3. Server verifies token, creates **HttpOnly session cookie** (7 days)
4. Middleware validates cookie on protected routes
5. `AuthContext` syncs user profile from Firestore

**Role Assignment:**
- Principal: Pre-seeded via script, email/password + PIN
- Teacher/Mentor: Self-register → Principal approves → Role assigned

---

## 🛡️ Security Rules (Firestore)

```javascript
// firestore.rules - key rules
match /users/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && 
    (request.auth.uid == userId || get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'principal');
}

match /attendance/{docId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['teacher', 'mentor'];
}
```

Deploy: `firebase deploy --only firestore:rules`

---

## 🌱 Seeding Initial Data

```bash
# Seed principal (run once)
npx tsx src/scripts/seed-principal.ts

# Seed streams, subjects, sections, schedule
npx tsx src/scripts/seed-defaults.ts
```

---

## 🧪 Testing

```bash
npm run lint         # ESLint (Next.js config)
npm run typecheck    # TypeScript check (if added)
```

---

## 📦 Deployment

### Vercel (Recommended)
1. Connect GitHub repo
2. Add environment variables
3. Deploy — automatic HTTPS, edge functions

### Firebase Hosting + Cloud Run
```bash
npm run build
firebase deploy
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start"]
```

---

## 🎨 Theming

Tailwind CSS v4 with CSS variables in `src/app/globals.css`:
- **Light/Dark** via `next-themes`
- **Stream colors**: MPC (Indigo), BiPC (Emerald), CEC (Amber)
- **Semantic tokens**: `--primary`, `--success`, `--warning`, `--destructive`
- **Glassmorphism**: `.glass`, `.glass-card` utilities

---

## 📝 License

Proprietary — EduNexus / CollegeDost

---

## 🤝 Contributing

Internal project — contact maintainers for access.