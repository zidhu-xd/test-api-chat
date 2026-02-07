# My App - Expo + Express Project

## Overview
This is a React Native (Expo) mobile application with an Express.js backend server. The backend serves a landing page and API routes, while the frontend is built with Expo for cross-platform mobile development.

## Recent Changes
- 2026-02-07: Initial project import to Replit environment. Installed npm dependencies, created PostgreSQL database, pushed database schema.

## Project Architecture

### Tech Stack
- **Frontend**: React Native with Expo SDK 54, React Navigation, TanStack React Query
- **Backend**: Express.js 5 with TypeScript, running via tsx
- **Database**: PostgreSQL (Neon-backed via Replit), Drizzle ORM
- **Schema**: Defined in `shared/schema.ts`, managed with `drizzle-kit`

### Directory Structure
- `client/` - Expo/React Native frontend code
- `server/` - Express.js backend (index.ts, routes.ts, storage.ts, templates/)
- `shared/` - Shared code between client and server (schema.ts)
- `scripts/` - Build scripts
- `assets/` - Static assets
- `xdserver/` - Additional server utilities

### Key Scripts
- `npm run server:dev` - Start backend dev server (port 5000)
- `npm run expo:dev` - Start Expo dev server
- `npm run db:push` - Push database schema changes
- `npm run server:build` - Build server for production (esbuild)
- `npm run server:prod` - Run production server

### Workflows
- **Start Backend**: `npm run server:dev` - Runs the Express server on port 5000
- **Start Frontend**: `npm run expo:dev` - Runs the Expo development server

### Database
- PostgreSQL with Drizzle ORM
- Schema file: `shared/schema.ts`
- Config: `drizzle.config.ts`
- Currently has a `users` table with id (UUID), username, and password fields

## User Preferences
- (None recorded yet)
