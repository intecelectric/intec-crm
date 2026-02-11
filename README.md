# Intec Electric CRM

Internal CRM for **Intec Electric**, a licensed electrical contractor in Hollywood, Florida.
Manages customers, jobs, invoices, crew assignments, and activity tracking.

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui-style components
- **Backend:** Node.js + Express REST API
- **Database:** PostgreSQL + Prisma ORM
- **PDF Generation:** Puppeteer
- **Email:** Resend SDK
- **Auth:** JWT with httpOnly cookies

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally
- A PostgreSQL database named `intec_crm`

### 1. Clone and install

```bash
git clone <repo-url> intec-crm
cd intec-crm
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/intec_crm?schema=public"
JWT_SECRET="generate-a-strong-secret-here"
PORT=3001
NODE_ENV=development
RESEND_API_KEY=""          # Optional — leave blank to skip emails
EMAIL_FROM="marcus@intecelectricfl.com"
CLIENT_URL="http://localhost:5173"
```

### 3. Set up database

```bash
npm run db:migrate    # Creates all tables
npm run db:seed       # Seeds company settings, sample data
```

### 4. Start development servers

```bash
npm run dev           # Starts both client (:5173) and server (:3001)
```

### 5. Login

```
Email:    marcus@intecelectricfl.com
Password: intec2024
```

## Project Structure

```
intec-crm/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # Layout, ProtectedRoute, UI primitives
│   │   ├── contexts/        # AuthContext
│   │   ├── lib/             # api.js, format.js, utils.js
│   │   └── pages/           # All page components
│   └── vite.config.js
├── server/                  # Express backend
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.js          # Sample data seed
│   └── src/
│       ├── index.js          # Express app + cron
│       ├── middleware/        # JWT auth
│       ├── routes/            # All API routes
│       ├── services/          # PDF + email services
│       └── utils/             # Prisma client, helpers
└── package.json              # Root scripts
```

## API Endpoints

| Group | Endpoints |
|-------|-----------|
| Auth | `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` |
| Customers | `GET/POST /api/customers` · `GET/PUT/DELETE /api/customers/:id` |
| Jobs | `GET/POST /api/jobs` · `GET/PUT/DELETE /api/jobs/:id` · `POST /api/jobs/:id/crew` · `DELETE /api/jobs/:id/crew/:crewId` |
| Invoices | `GET/POST /api/invoices` · `GET/PUT/DELETE /api/invoices/:id` · `POST /api/invoices/:id/payments` · `POST /api/invoices/:id/send` · `GET /api/invoices/:id/pdf` |
| Crew | `GET/POST /api/crew` · `GET/PUT/DELETE /api/crew/:id` |
| Activities | `GET /api/activities` |
| Settings | `GET/PUT /api/settings` |
| Dashboard | `GET /api/dashboard` |

## Deploy to Railway

### 1. Create a new Railway project

- Go to [railway.app](https://railway.app) and create a new project
- Add a **PostgreSQL** database service
- Add a **new service** from your GitHub repo

### 2. Configure build settings

In the Railway service settings:

| Setting | Value |
|---------|-------|
| Root Directory | `/` |
| Build Command | `cd client && npm install && npm run build && cd ../server && npm install && npx prisma generate` |
| Start Command | `cd server && npx prisma migrate deploy && node src/index.js` |

### 3. Set environment variables

In the Railway service **Variables** tab, add:

```env
DATABASE_URL        = ${{Postgres.DATABASE_URL}}   # Railway auto-links this
JWT_SECRET          = <generate a strong random string>
PORT                = 3001
NODE_ENV            = production
RESEND_API_KEY      = re_xxxxxxxxxxxx               # From resend.com
EMAIL_FROM          = marcus@intecelectricfl.com
CLIENT_URL          = https://your-app.up.railway.app
```

### 4. Seed the database (first deploy only)

Open the Railway service shell and run:

```bash
cd server && npx prisma db seed
```

### 5. Custom domain (optional)

In Railway service **Settings > Networking**, add your custom domain and update `CLIENT_URL` accordingly.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `PORT` | No | Server port (default: 3001) |
| `NODE_ENV` | No | `development` or `production` |
| `RESEND_API_KEY` | No | Resend.com API key for sending emails |
| `EMAIL_FROM` | No | Sender email address (default: marcus@intecelectricfl.com) |
| `CLIENT_URL` | No | Frontend URL for CORS (default: http://localhost:5173) |

## Key Features

- **Auto-numbered jobs** (JOB-0001) and **invoices** (INV-0001)
- **Status tracking** with full activity log for every change
- **Invoice PDF generation** with branded Intec Electric template
- **Email invoices** with PDF attachment via Resend
- **Work order inbox** — flagged jobs send notifications to workorders@intecelectricfl.com
- **Payment recording** with automatic balance + status updates
- **Overdue invoice detection** — daily cron at 8am marks past-due invoices
- **Crew management** with job assignments
- **Dashboard** with revenue stats, active jobs, and alerts
- **Dark theme UI** with responsive mobile layout
- **QuickBooks-ready** fields on invoices (qbCustomerId, qbInvoiceId)

## Company Info (Pre-configured)

- **Intec Electric**
- 919 N. 25th Ave, Hollywood, Florida 33020
- 754-233-4511
- www.intecelectricfl.com
- License: EC# 13012287
