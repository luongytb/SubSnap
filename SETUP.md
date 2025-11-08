# SubSnap Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
# or
bun install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication (get from https://dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex Database (will be added automatically after step 3)
NEXT_PUBLIC_CONVEX_URL=https://...
```

### 3. Initialize Convex Database

**IMPORTANT:** Run this command first to generate required files:

```bash
npx convex dev
```

This will:
- Create a Convex account (if you don't have one)
- Generate TypeScript types in `convex/_generated/`
- Add `NEXT_PUBLIC_CONVEX_URL` to your `.env.local`
- Start the Convex dev server

**Keep this terminal running** - it watches for changes and syncs your schema.

### 4. Start Development Server

In a **new terminal**, run:

```bash
npm run dev
# or
bun dev
```

### 5. Open Your App

Visit http://localhost:3000

## Troubleshooting

### "Module not found: Can't resolve '@/convex/_generated/react'"

**Solution:** Run `npx convex dev` first. This generates the required Convex files.

### "CONVEX_URL environment variable is missing"

**Solution:** Make sure you've run `npx convex dev` at least once. It will add the URL to your `.env.local` file.

### Build Errors

Make sure both servers are running:
1. `npx convex dev` (Terminal 1)
2. `npm run dev` (Terminal 2)

## Project Structure

```
subscription-tracker/
├── app/                    # Next.js app directory
├── components/             # React components
├── convex/                 # Convex backend
│   ├── schema.ts          # Database schema
│   ├── subscriptions.ts   # Database functions
│   └── _generated/        # Auto-generated (created by Convex)
├── lib/                    # Utilities and hooks
└── .env.local             # Environment variables (create this)
```

## Features

- ✅ User authentication with Clerk
- ✅ Real-time database with Convex
- ✅ Add/Edit/Delete subscriptions
- ✅ Multiple charges per subscription (SIP support)
- ✅ Export/Import data
- ✅ Statistics and analytics
- ✅ Multi-currency support

## Next Steps

1. Sign up for Clerk: https://dashboard.clerk.com
2. Run `npx convex dev` to set up the database
3. Start building! 🚀

