# Neon DB Setup Guide

## Step 1: Create a Neon Database

1. Go to https://neon.tech and sign up/login
2. Create a new project
3. Copy your connection string (it will look like: `postgresql://user:password@host/database?sslmode=require`)

## Step 2: Set Up Environment Variables

Add to your `.env.local` file:

```env
DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

## Step 3: Install Dependencies

Dependencies are already installed:
- `drizzle-orm` - ORM for TypeScript
- `@neondatabase/serverless` - Neon serverless driver
- `drizzle-kit` - Drizzle CLI tool

## Step 4: Generate Database Schema

Run this command to create the database tables:

```bash
bunx drizzle-kit push
```

This will:
- Read your schema from `drizzle/schema.ts`
- Create the `subscriptions` table in your Neon database
- Set up all indexes and constraints

## Step 5: Verify Setup

1. Start your dev server: `npm run dev` or `bun dev`
2. Sign in to your app
3. Add a subscription - it should save to Neon!

## Database Structure

The `subscriptions` table has:
- `id` - Primary key (CUID)
- `user_id` - Clerk user ID (indexed)
- `title` - Subscription name
- `description` - Optional description
- `url` - Optional website URL
- `price` - Base price (decimal)
- `charges` - JSONB array of charges (for SIPs)
- `currency` - Currency code
- `recurring_duration` - weekly, monthly, yearly, etc.
- `start_date` - When subscription started
- `created_at` - When record was created

## Useful Commands

- `bunx drizzle-kit push` - Push schema changes to database
- `bunx drizzle-kit generate` - Generate migration files
- `bunx drizzle-kit migrate` - Run migrations
- `bunx drizzle-kit studio` - Open Drizzle Studio (database GUI)

## Migration from LocalStorage

Your existing localStorage data will remain, but new data will go to Neon. To migrate:

1. Export your data using the Export button
2. Sign out and sign back in
3. Import your data using the Import button

The app now uses Neon DB for all new subscriptions!

