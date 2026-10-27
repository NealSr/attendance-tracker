# Attendance Tracker

Attendance Tracker is a React/Vite app with an Express API. The deployment target is Vercel for the app and API, with Supabase Postgres for persistent data. The API uses the Supabase service-role key server-side; it is never needed in the browser.

Features include attendance tracking for people and events, hire/end dates, department reports, CSV export, and bulk import.

## Migration from the EC2 SQLite database

The checked-in backend previously stored data in `backend/attendance.db`. That file is intentionally ignored by Git, so the migration script needs a local copy of the live SQLite database.

1. Make a consistent SQLite backup on EC2 while writes are paused, then transfer that backup securely to this machine. Do not commit the database or put it in a public location.
2. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor.
3. Configure `backend/.env` (this file is ignored by Git):

   ```dotenv
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
   JWT_SECRET=YOUR_LONG_RANDOM_SECRET
   SQLITE_DATABASE_PATH=./attendance.db
   ```

   `SQLITE_DATABASE_PATH` is optional; the default is `backend/attendance.db`. Keep the service-role key and JWT secret private. Never add either to a `VITE_` variable or browser code.
4. If the existing account still uses a default or weak password, set `MIGRATION_ADMIN_PASSWORD` in `backend/.env` to a new password before importing. It must be at least 12 characters. The importer hashes it and writes only the hash to Supabase. Set `MIGRATION_ADMIN_USERNAME` too if the account is not named `admin`.
5. From the repository root, install dependencies and import the tables:

   ```bash
   npm install
   npm run migrate:sqlite --workspace attendance-backend
   ```

   The importer carries over people, events, attendance, users, and their IDs. It stops before importing if it finds attendance rows without a person or event. It can be rerun after an interrupted import; it upserts by ID and does not delete Supabase rows. Only rerun it before cutover: matching Supabase rows are overwritten with the SQLite snapshot. Keep EC2 available and do not resume writes to the old database during the final snapshot/import/cutover.

## Deploy to Vercel

1. Import this repository into Vercel with the repository root (`.`) as the project root and the framework preset set to **Express** (or allow Vercel to detect Express). Clear any dashboard Output Directory override; Vite builds static files into the root `public/` directory.
2. Add `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `JWT_SECRET` as Vercel environment variables for the target environments. Do not set `SQLITE_DATABASE_PATH` or `MIGRATION_ADMIN_PASSWORD` in Vercel.
3. Deploy. The root [`index.js`](./index.js) is the Express Vercel Function entry point and serves the built app shell. Vite builds the frontend into `public/`; Vercel serves its JS and other assets as static files.
4. Confirm the login and existing attendance records before switching users over. Keep the EC2 app/database as a rollback source until the cutover is verified.

RLS is enabled on all four tables without public policies. The API uses the service-role key and enforces the existing signed-token login before accessing application data.

## Local development

Requires Node.js 20 or newer. From the repository root:

```bash
npm install
npm run dev --workspace attendance-backend
```

In another terminal:

```bash
npm run start --workspace attendance-frontend
```

The Vite development server proxies `/api` to the backend at `http://localhost:3001`. Configure `backend/.env` as above, then open the URL printed by Vite.
