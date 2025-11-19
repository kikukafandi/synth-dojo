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

For the full experience including PvP mode, you need to run both the Next.js server and the WebSocket server:

```bash
# Run both servers concurrently
npm run all

# Or run them separately:
# Terminal 1: Next.js server
npm run dev

# Terminal 2: WebSocket server
npm run dev:socket
```

The Next.js app will be at http://localhost:3000
The WebSocket server will be at http://localhost:3001

**Note:** PvP mode requires both servers to be running.

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

### Deploy WebSocket Server (for PvP Mode)

The WebSocket server (`socket-server.js`) handles real-time PvP matchmaking. For production:

1. **Deploy to a Node.js hosting service** (e.g., Railway, Render, or DigitalOcean)
   - Deploy the entire repository
   - Set start command to: `node socket-server.js`
   - Add environment variables:
     ```
     DATABASE_URL=your_neon_connection_string
     PORT=3001
     CORS_ORIGIN=https://your-vercel-app.vercel.app
     ```

2. **Update Frontend Configuration**
   - Add to Vercel environment variables:
     ```
     NEXT_PUBLIC_SOCKET_URL=https://your-websocket-server.com
     ```

3. **Enable WebSocket Support**
   - Ensure your hosting provider supports WebSocket connections
   - Configure CORS to allow your Vercel domain

**Note:** Without the WebSocket server, PvP mode won't work but all other features will function normally.

## Available Scripts

```bash
npm run dev          # Development server (Next.js only)
npm run all          # Run both Next.js and WebSocket servers
npm run dev:next     # Next.js development server
npm run dev:socket   # WebSocket server for PvP mode
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
- ✅ **PvP battles with real-time matchmaking**
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
