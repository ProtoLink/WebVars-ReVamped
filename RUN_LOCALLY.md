# Running WebVar Locally on Ubuntu

This guide covers running the application locally on Ubuntu without Replit-specific services.

## Requirements

Install:

- Node.js 20.x
- npm
- PostgreSQL
- Git, if cloning the repository
- Build tools for native npm dependencies

The Replit configuration uses Node.js 20 and PostgreSQL 16. PostgreSQL 16 is the closest local match.

```bash
sudo apt update
sudo apt install -y \
  postgresql \
  postgresql-contrib \
  build-essential \
  python3 \
  git \
  curl \
  openssl
```

Start PostgreSQL:

```bash
sudo systemctl enable --now postgresql
```

Install Node.js 20 using your preferred method. If `nvm` is installed:

```bash
nvm install 20
nvm use 20
```

Verify the runtime:

```bash
node --version
npm --version
```

## Create a local PostgreSQL database

Open PostgreSQL as the administrator:

```bash
sudo -u postgres psql
```

Create a local application user and database:

```sql
CREATE USER webvar WITH PASSWORD 'change-this-password';
CREATE DATABASE webvar OWNER webvar;
\q
```

Use a stronger password for anything beyond a local development machine.

## Environment variables

The application requires `DATABASE_URL`:

```bash
export DATABASE_URL='postgresql://webvar:change-this-password@127.0.0.1:5432/webvar'
```

Set `SESSION_SECRET` explicitly, especially when running in production mode:

```bash
export SESSION_SECRET="$(openssl rand -hex 32)"
```

The application has a development fallback for `SESSION_SECRET`, but relying on it is not recommended.

The project does not include automatic `.env` loading. Export variables in the shell, or pass them directly to a command:

```bash
DATABASE_URL='postgresql://...' SESSION_SECRET='...' npm run dev
```

`REPL_ID` is optional and only enables a Replit development plugin. No PayPal, Stripe, OpenAI, or other external API credentials are required for the application to start.

## Install dependencies

From the project root:

```bash
npm ci
```

This installs the exact dependency versions recorded in `package-lock.json`.

The project uses:

- React and Vite for the frontend
- Express and WebSockets for the server
- PostgreSQL with `pg` and Drizzle ORM
- `express-session` and `memorystore` for web sessions
- `bcrypt` for password hashing
- Helmet, compression, and rate limiting for server middleware
- TypeScript, `tsx`, esbuild, and Drizzle Kit for development and builds

No manual installation of individual npm packages is needed beyond `npm ci`.

## Initialize the database schema

After setting `DATABASE_URL`, apply the schema:

```bash
npm run db:push
```

The schema is defined in `shared/schema.ts`. The application does not use the old local SQLite files under `data/`; it requires PostgreSQL.

To verify that the expected tables exist:

```bash
npx tsx server/migrate.ts
```

## Run in development mode

Run the application with:

```bash
npm run dev
```

This starts the Express server and Vite development server on port `5000`:

```text
http://localhost:5000
```

The development server includes frontend hot reload, the API, WebSocket support, and local username/password login and signup.

## Verify the project

Run TypeScript checking:

```bash
npm run check
```

## Build and run in production mode

Build the frontend and server bundle:

```bash
npm run build
```

The build produces:

- `dist/public/` — compiled frontend assets
- `dist/index.js` — bundled server

Start the production build:

```bash
npm run start
```

The production server also listens on port `5000`.

Production mode marks session cookies as secure. Because secure cookies require HTTPS, logging in through plain `http://localhost:5000` may not work when using `npm run start`. Use `npm run dev` for normal local development, or place the production process behind a local HTTPS reverse proxy.

## Complete first-time setup

```bash
# Select Node.js 20 if using nvm
nvm use 20

# Configure the local database and session secret
export DATABASE_URL='postgresql://webvar:change-this-password@127.0.0.1:5432/webvar'
export SESSION_SECRET="$(openssl rand -hex 32)"

# Install and initialize
npm ci
npm run db:push

# Optional verification
npm run check

# Start the application
npm run dev
```

Open `http://localhost:5000` in a browser.

## Troubleshooting

### `DATABASE_URL is required`

Export `DATABASE_URL` in the same shell before running the app or database commands.

### Database connection refused

Check that PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

Start it if necessary:

```bash
sudo systemctl start postgresql
```

### Missing database tables

Run:

```bash
npm run db:push
```

### Port already in use

The server currently uses port `5000` unconditionally. Stop the process using that port before starting the application.

### Replit-specific documentation

`.replit` configures the Replit workflow and deployment, but it is not required for local Ubuntu execution. The local application uses its own username/password authentication and the standard PostgreSQL `pg` driver.