# Offerly

A modern Career CRM built with Next.js — track job applications, analyze fit scores with AI, and manage your entire job search pipeline in one place.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)

---

## Features

### Application Tracking
- Add job applications manually, via URL, or using **AI Smart Import**
- Track status through stages: Applied → Recruiter Screen → Technical Interview → System Design → Final Interview → Offer / Rejected / Ghosted
- Add notes, schedule interviews, and store job descriptions

### AI-Powered Tools
- **Smart Import** — paste a full job description and the AI extracts company name, role, salary range, tech stack, location, remote type, how to apply, and important notes
- **Job Analysis** — get tech stack breakdown, seniority assessment, fit summary, and interview preparation tips
- Powered by OpenAI's `gpt-4o-mini` using the user's own API key (stored per-user, not server-wide)

### Fit Score Algorithm
Automatically scores each application against your profile using a weighted formula:

| Factor | Weight | What it evaluates |
|--------|--------|-------------------|
| Tech Stack Match | 40% | Primary (100%) and secondary (60%) skill overlap |
| Experience | 25% | Years of experience vs. job requirements |
| Salary | 15% | Salary range alignment |
| Remote Preference | 10% | Remote/hybrid/onsite compatibility |
| English Level | 10% | Language proficiency |

### Kanban Pipeline
- Visual board with columns for each application stage
- Drag-and-drop between stages
- Cards show company, role, fit score, and salary range

### Rankings
- Applications sorted by fit score
- Visual indicators for score quality

### Dashboard & Analytics
- Metric cards: total applications, interviews, offers, rejections
- Conversion funnel visualization
- Application sources breakdown (pie chart)
- Timeline chart of applications over time
- Upcoming interviews list

### Profile Management
- Read-only view with edit mode toggle
- Sections: Experience, Tech Stack, Preferences, AI Settings
- Tech stack tags with primary/secondary distinction

### Authentication
- Email/password registration with strength validation (8+ chars, uppercase, lowercase, number, symbol)
- Google OAuth sign-in
- JWT-based sessions
- Protected routes via middleware

### Design System
- Light and dark mode with system preference detection
- Consistent component library: Card, Button, Tabs, StatusBadge, MetricCard, FormInput
- Responsive layout (mobile-first with slide-out sidebar)
- Smooth animations and transitions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack) |
| Language | [TypeScript 5](https://typescriptlang.org) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Database | [PostgreSQL](https://postgresql.org) via [Prisma 7](https://prisma.io) |
| Auth | [NextAuth.js 4](https://next-auth.js.org) (Credentials + Google OAuth) |
| Charts | [Recharts 3](https://recharts.org) |
| AI | [OpenAI API](https://platform.openai.com) (gpt-4o-mini) |
| Hosting | [Vercel](https://vercel.com) (recommended) |
| Database Hosting | [Neon](https://neon.tech) (recommended) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud like [Neon](https://neon.tech))
- Google OAuth credentials (optional, for Google sign-in)

### 1. Clone and install

```bash
git clone https://github.com/your-username/offerly.git
cd offerly
npm install
```

### 2. Configure environment variables

Create a `.env` file in the root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/offerly"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Generate a secret key:

```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
npx prisma migrate dev
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Schema

```
User
├── Profile (1:1) — experience, stack, salary preferences
├── Account (1:N) — OAuth providers (Google)
├── Session (1:N) — auth sessions
└── JobApplication (1:N)
    ├── Note (1:N) — notes, feedback, follow-ups
    └── Interview (1:N) — scheduled interviews
```

### Models

| Model | Key Fields |
|-------|-----------|
| **User** | email, hashedPassword, openaiApiKey |
| **Profile** | yearsOfExperience, primaryStack, secondaryStack, preferredRoles, englishLevel, salary range, remotePreference, preferredCompanyStage |
| **JobApplication** | companyName, roleTitle, salary range, location, remoteType, techStack, status, fitScore, jobDescription |
| **Note** | type (note/feedback/follow-up), content |
| **Interview** | interviewDate, stage, meetingLink, notes |
| **Account** | provider, providerAccountId, tokens |

---

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth handler |
| `/api/auth/register` | POST | Create account (with password validation) |
| `/api/applications` | GET | List applications (filter by `?status=`) |
| `/api/applications` | POST | Create application (auto-calculates fit score) |
| `/api/applications/[id]` | GET, PUT, DELETE | Read, update, or delete application |
| `/api/applications/[id]/notes` | POST, DELETE | Add or remove notes |
| `/api/applications/[id]/interviews` | POST, DELETE | Add or remove interviews |
| `/api/profile` | GET, PUT | Read or update profile + API key |
| `/api/analytics` | GET | Dashboard analytics data |
| `/api/ai/analyze` | POST | AI job analysis |
| `/api/ai/parse-job` | POST | AI job description parser |

---

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Authenticated routes
│   │   ├── dashboard/          # Analytics dashboard
│   │   ├── applications/       # Application list + detail
│   │   ├── pipeline/           # Kanban board
│   │   ├── rankings/           # Fit score rankings
│   │   └── profile/            # Profile management
│   ├── api/                    # API routes
│   │   ├── ai/                 # AI endpoints (analyze, parse-job)
│   │   ├── analytics/          # Dashboard data
│   │   ├── applications/       # CRUD + notes + interviews
│   │   ├── auth/               # NextAuth + register
│   │   └── profile/            # Profile CRUD
│   ├── login/                  # Login page
│   ├── register/               # Registration page
│   ├── icon.tsx                # Dynamic favicon
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Theme variables + animations
├── components/
│   ├── ui.tsx                  # Core UI components
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── ThemeProvider.tsx        # Light/dark/system theme
│   ├── Providers.tsx           # Session + theme providers
│   ├── PasswordStrength.tsx    # Password validation UI
│   ├── StatusBadge.tsx         # Application status badges
│   ├── FitScoreBadge.tsx       # Fit score badges
│   ├── OfferlyLogo.tsx         # App logo
│   └── Icons.tsx               # SVG icon components
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── prisma.ts               # Prisma client singleton
│   └── fit-score.ts            # Fit score algorithm
├── middleware.ts               # Route protection
└── types/
    └── next-auth.d.ts          # NextAuth type extensions
```

---

## Deployment

### Vercel (recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Settings → Environment Variables:
   - `DATABASE_URL` — your cloud PostgreSQL URL (e.g. from Neon)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` — your Vercel domain (`https://your-app.vercel.app`)
   - `GOOGLE_CLIENT_ID` (optional)
   - `GOOGLE_CLIENT_SECRET` (optional)
4. Deploy

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
4. Copy Client ID and Client Secret to your environment variables

### OpenAI Integration

The OpenAI API key is stored **per user** in their profile — not as a server environment variable. Each user adds their own key in **Profile → AI Settings** to enable:
- Smart Import (job description parsing)
- Job Analysis (fit summary, interview tips)

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## License

MIT
