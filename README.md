# Synth-Dojo

A real-time coding learning platform with AI battles, PvP matches, gamification, and global leaderboards. Built with Next.js, Prisma, NextAuth, and Tailwind CSS.

## 🚀 Features

### Core Features
- **Authentication**: Email/password + OAuth (Google, GitHub) with NextAuth
- **Learning Modules**: Structured lessons with embedded practice problems
- **Practice Mode**: Run code with automated test case evaluation
- **AI Battle Mode**: Challenge AI opponents matched to your skill level
- **PvP Mode**: Real-time player vs player coding battles with Socket.IO
- **Leaderboard**: Global rankings with points, levels, and win rates
- **Admin Panel**: Full CRUD for modules, lessons, questions, users

### Gamification
- **Points & XP**: Earn points for completing challenges and winning battles
- **Levels**: Progress through levels based on accumulated points
- **HP System**: Health points that increase with wins and decrease with losses
- **Achievements**: Unlock badges for various accomplishments
- **Streak Tracking**: Daily streak system for consistent learning

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Real-time**: Socket.IO for PvP matchmaking and battles
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth (v5 beta) with Prisma adapter
- **Deployment**: Vercel (frontend) + Neon (database)
- **Language**: TypeScript
- **Code Quality**: ESLint

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or Neon)
- Git

## 🏁 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/kikukafandi/synth-dojo.git
cd synth-dojo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/synthdojo?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

### 4. Generate NextAuth secret

```bash
npx auth secret
```

Copy the generated secret to your `.env` file as `NEXTAUTH_SECRET`.

### 5. Set up the database

#### For local PostgreSQL:

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run db:seed
```

#### For Neon (Production):

1. Create a new project at [Neon](https://neon.tech)
2. Copy the connection string
3. Update `DATABASE_URL` in `.env`
4. Run migrations and seed:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 6. Run the development server

For the complete experience with PvP mode:

```bash
# Run both Next.js and WebSocket servers
npm run all
```

Or run them separately:

```bash
# Terminal 1: Next.js server
npm run dev

# Terminal 2: WebSocket server (for PvP)
npm run dev:socket
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Note:** PvP mode requires both servers running. Other features work with just `npm run dev`.

### 7. Login with default accounts

**Admin Account:**
- Email: `admin@synthdojo.com`
- Password: `admin123`

**User Account:**
- Email: `user@synthdojo.com`
- Password: `user123`

## 📁 Project Structure

```
synth-dojo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── admin/             # Admin panel
│   │   ├── api/               # API routes
│   │   ├── battle/            # AI battle page
│   │   ├── dashboard/         # User dashboard
│   │   ├── learn/             # Learning modules
│   │   ├── leaderboard/       # Global leaderboard
│   │   └── pvp/               # PvP arena
│   └── components/            # Reusable components
│       ├── BattleArena.tsx
│       ├── CodeEditor.tsx
│       ├── LessonContent.tsx
│       └── Navbar.tsx
├── lib/                       # Utility libraries
│   ├── evaluator.ts          # Code evaluation engine
│   ├── prisma.ts             # Prisma client
│   └── utils.ts              # Helper functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeder
├── auth.ts                   # NextAuth configuration
└── package.json
```

## 🗄️ Database Schema

The platform uses the following main models:

- **User**: User accounts with auth, points, level, HP
- **Profile**: Extended user information
- **Module**: Learning modules
- **Lesson**: Individual lessons within modules
- **Question**: Practice questions and test cases
- **Match**: Battle/PvP match records
- **MatchSubmission**: Code submissions during matches
- **Achievement**: Available achievements
- **LeaderboardEntry**: Cached leaderboard rankings

See `prisma/schema.prisma` for full schema details.

## 🎮 Usage

### For Users

1. **Register/Login**: Create an account or sign in
2. **Dashboard**: View your stats, recent matches, and achievements
3. **Learn**: Browse modules and complete lessons with practice problems
4. **AI Battle**: Challenge AI opponents to earn points and level up
5. **PvP Arena**: Battle against real players in real-time coding matches
6. **Leaderboard**: Check your global ranking and compete with others

### For Admins

1. **Admin Panel**: Access at `/admin` (requires admin role)
2. **Manage Modules**: Create/edit learning modules and lessons
3. **Manage Questions**: Add/edit practice questions with test cases
4. **View Analytics**: Monitor platform usage and user activity

## 🧪 Testing

The code evaluator automatically validates submissions against test cases:

```typescript
// Example test case format in Question.testCases
[
  { input: [2, 3], expected: 5 },
  { input: [10, 20], expected: 30 }
]
```

Evaluation returns:
- **Correctness**: Whether all test cases passed
- **Runtime**: Execution time in milliseconds
- **Style Score**: Code quality heuristic (0-100)

## 🎮 PvP Mode

The PvP (Player vs Player) mode allows real-time coding battles between users:

### How It Works

1. **Matchmaking**: Click "Find Match" to enter the matchmaking queue
2. **Level Matching**: System matches you with players within ±2 levels
3. **Real-time Battle**: Both players receive the same coding challenge
4. **Live Progress**: See your opponent's coding progress in real-time
5. **Winner Determination**: First to submit the best solution wins based on:
   - **Correctness** (must pass all test cases)
   - **Runtime** (faster execution = bonus points)
   - **Code Style** (cleaner code = bonus points)

### Technical Details

- **WebSocket Server**: Runs on port 3001 for real-time communication
- **Queue System**: FIFO matchmaking with level-based filtering
- **Auto-generated Questions**: AI-powered coding challenges
- **Real-time Updates**: Live opponent progress tracking via Socket.IO
- **Match Recording**: All matches saved to database for history

### Running PvP Mode

```bash
# Development: Run both servers
npm run all

# Production: Deploy socket-server.js separately
# See DEPLOYMENT.md for details
```

## 📝 Scripts

```bash
npm run dev          # Start Next.js development server
npm run all          # Run both Next.js and WebSocket servers
npm run dev:next     # Next.js server only
npm run dev:socket   # WebSocket server for PvP mode
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
```

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Deploy Database to Neon

1. Create project at [Neon](https://neon.tech)
2. Copy connection string to `DATABASE_URL`
3. Run migrations:

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

## 🎨 Code Style

This project follows **Clear Flow Programming Style**:
- Simple, clean, flat flow
- Minimal nesting
- Honest variable names (camelCase)
- Comments only when necessary
- To-the-point implementations

## 🔐 Security

- Passwords hashed with bcrypt
- Session-based authentication with JWT
- Input validation on all API endpoints
- SQL injection prevention via Prisma
- XSS protection via React

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Prisma for the excellent ORM
- Vercel for hosting platform
- Neon for serverless Postgres

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ by the Synth-Dojo team
