# Synth-Dojo - Deployment Guide

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
```

Edit `.env` and add:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `npx auth secret`
- (Optional) OAuth credentials for Google/GitHub

### 3. Setup Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data (admin + user accounts)
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

### 5. Default Accounts

**Admin:**
- Email: admin@synthdojo.com
- Password: admin123

**User:**
- Email: user@synthdojo.com
- Password: user123

## Production Deployment

### Deploy to Vercel

1. **Push to GitHub** (already done)

2. **Import Project in Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Framework Preset: Next.js
   - Root Directory: ./

3. **Add Environment Variables**
   ```
   DATABASE_URL=your_neon_connection_string
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=your_generated_secret
   GOOGLE_CLIENT_ID=optional
   GOOGLE_CLIENT_SECRET=optional
   GITHUB_CLIENT_ID=optional
   GITHUB_CLIENT_SECRET=optional
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy

### Setup Neon Database

1. **Create Neon Project**
   - Go to https://neon.tech
   - Create new project
   - Copy connection string

2. **Update Environment**
   - Add `DATABASE_URL` to Vercel environment variables
   - Format: `postgres://user:pass@host/db?sslmode=require`

3. **Run Migrations**
   ```bash
   # Set DATABASE_URL in your local .env
   npm run db:push
   npm run db:seed
   ```

## Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # Run ESLint
npm test             # Run unit tests
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
```

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: NextAuth v5
- **Language**: TypeScript
- **Testing**: Vitest
- **Hosting**: Vercel (frontend) + Neon (database)

## Project Structure

```
synth-dojo/
├── src/
│   ├── app/                  # Next.js pages
│   │   ├── (auth)/          # Auth pages
│   │   ├── admin/           # Admin panel
│   │   ├── api/             # API routes
│   │   ├── battle/          # AI battle
│   │   ├── dashboard/       # Dashboard
│   │   ├── learn/           # Modules
│   │   ├── leaderboard/     # Rankings
│   │   └── pvp/             # PvP arena
│   ├── components/          # React components
│   └── lib/                 # Utilities
│       ├── auth.ts          # NextAuth config
│       ├── evaluator.ts     # Code evaluation
│       ├── prisma.ts        # Prisma client
│       └── utils.ts         # Helpers
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script
└── README.md
```

## Features Overview

### For Users
- ✅ Register/Login (email + OAuth)
- ✅ Dashboard with progress tracking
- ✅ Learning modules with lessons
- ✅ Practice mode with code execution
- ✅ AI battles with scoring
- ✅ Global leaderboard
- ✅ Gamification (points, levels, HP)
- ✅ Achievements system

### For Admins
- ✅ CRUD for modules
- ✅ CRUD for questions
- ✅ User management
- ✅ Platform analytics
- ✅ Content moderation

## Security Notes

- Passwords hashed with bcrypt
- JWT-based sessions
- Input validation on all endpoints
- SQL injection prevention via Prisma
- CSRF protection via NextAuth
- Environment variables for secrets

## Support

For issues or questions:
1. Check the README.md
2. Review the code documentation
3. Open an issue on GitHub

## License

MIT License

---

Built with ❤️ by the Synth-Dojo team
