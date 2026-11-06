# CRUD Studio

A full-stack CRUD application with a React + Material UI frontend and an Express + Supabase PostgreSQL backend.

The app manages three related entities:

- **Products** — name, description, price, quantity
- **Users** — name, email, password (hashed)
- **Orders** — one user, one product, and an order date

The UI includes a dashboard, searchable/paginated tables, create/edit dialogs, delete confirmations, order filtering by user and product, and responsive navigation.

---

## Project structure

```text
crud-test2/
├── package.json              # root build/start commands
├── supabase/
│   └── schema.sql            # tables, relationships, RLS, grants
├── backend/
│   ├── src/
│   │   ├── routes/           # products, users, orders API routes
│   │   ├── utils/            # validation and HTTP error helpers
│   │   ├── app.js            # Express application + static frontend
│   │   ├── config.js         # environment configuration
│   │   ├── db.js             # Supabase PostgreSQL connection pool
│   │   ├── index.js          # server entry point
│   │   └── seed.js           # optional demo data
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── dist/                 # generated production build
    ├── public/
    ├── src/
    │   ├── api/              # fetch API client
    │   ├── components/       # layout, dialogs, shared UI
    │   ├── hooks/
    │   ├── pages/            # dashboard, products, users, orders
    │   ├── utils/
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── theme.js
    ├── .env.example
    ├── vite.config.js
    └── package.json
```

---

## Production: one process

Requirements: **Node.js 20.19+** (Node.js 24 recommended), npm, and a Supabase project.

The Express server serves both the API and the built React application. There is only one application server to run.

### 1. Create the Supabase tables

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor -> New query**.
3. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql).
4. Click **Run**.

This creates the `products`, `users`, and `orders` tables, indexes, foreign keys, and RLS settings.

### 2. Configure the backend

```powershell
cd C:\crud-test2\backend
Copy-Item .env.example .env
notepad .env
```

Get the PostgreSQL connection string from **Supabase Dashboard -> Connect -> Session pooler** and add it to the backend environment:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

If the password contains special characters, use the connection string exactly as Supabase provides it. This is a server-only secret: never expose it in frontend code or commit it to Git. The backend connects directly to the Supabase PostgreSQL database.

### 3. Install dependencies

```powershell
cd C:\crud-test2
npm run install:all
```

### 4. Add optional demo data

```powershell
cd C:\crud-test2\backend
npm run seed
```

The seed credentials for every demo account are `password123`. There is no login flow; this is a management dashboard, and passwords are still hashed before storage.

### 5. Build and start everything

```powershell
cd C:\crud-test2
npm run serve
```

This command:

1. Runs the Vite production build (`frontend/dist`).
2. Starts one Express server.
3. Serves the UI and API together on **http://localhost:5001**.

Open:

- Frontend: **http://localhost:5001**
- API: **http://localhost:5001/api**
- Health: **http://localhost:5001/api/health**

You can also run the two steps separately:

```powershell
npm run build
npm start
```

The old `backend/data/crud.sqlite` file is no longer used by the application. Supabase is now the only data store.

> If the frontend source changes, run `npm run build` again before restarting the production server.

---

## Deploy to Render

Make sure the root files are committed and pushed to GitHub:

```text
README.md
package.json
render.yaml
backend/server.js
supabase/schema.sql
```

### Option A: Blueprint

The included [`render.yaml`](render.yaml) configures the service automatically:

1. Open **Render Dashboard -> New -> Blueprint**.
2. Connect the GitHub repository.
3. Apply the blueprint.
4. Add `DATABASE_URL` when prompted.

### Option B: Existing Render Web Service

Open the service settings and use:

| Setting | Value |
| --- | --- |
| Root Directory | Leave blank |
| Build Command | `npm run install:all && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Add this environment variable in Render:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
```

Do not upload `backend/.env`; Render environment variables replace it. The start command must not be `node backend/server.js` unless you deliberately use the compatibility wrapper. The recommended command is `npm start`.

If the service is still configured with:

```text
node backend/server.js
```

the new `backend/server.js` compatibility wrapper will also work, but the build command above is still required so the backend dependencies and frontend build exist.

---

## Development mode

For live reload while editing source code, run two development processes.

Terminal 1 — API:

```powershell
cd C:\crud-test2\backend
npm run dev
```

Terminal 2 — frontend:

```powershell
cd C:\crud-test2\frontend
npm run dev
```

Open **http://localhost:5174**. Vite proxies `/api` requests to `http://localhost:5001`.

Development uses ports `5174` and `5001`. Production uses only port `5001`, served by Express.

### Deploying frontend separately

The normal one-process setup uses relative `/api` requests, so no API URL is needed at build time. If you deploy the frontend separately from the API, set `VITE_API_URL` before building:

```env
VITE_API_URL=https://api.example.com/api
```

---

## Configuration

Copy the example environment files if you want to change defaults.

### Backend (`backend/.env`)

```env
PORT=5001
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres
FRONTEND_DIST=../frontend/dist
CORS_ORIGIN=http://localhost:5174
```

- `PORT` — application port (default `5001`)
- `DATABASE_URL` — Supabase PostgreSQL connection string (the backend uses `pg`)
- `FRONTEND_DIST` — path to the built React app; relative paths resolve from `backend/`
- `CORS_ORIGIN` — comma-separated allowed frontend origins; localhost origins are allowed in development

In production, the UI and API share the same origin, so CORS is not required. In development, Vite runs on `5174` and the API on `5001`.

> **Security:** `DATABASE_URL` contains the database password and connects as the `postgres` role. Keep it in `backend/.env`, which is ignored by Git. Do not expose it through Vite or the browser.

### Frontend (`frontend/.env.local`)

```env
# Leave empty to use the Vite proxy.
VITE_API_URL=
```

---

## Supabase database and relationships

The backend connects directly to the Supabase PostgreSQL database with the `pg` connection pool using `DATABASE_URL`. The browser never receives database credentials. RLS is enabled with no public policies, so direct anon/authenticated Data API access is blocked while the server's database role can perform CRUD operations.

> This project does not depend on the Supabase Data API/PostgREST, so it works even when that API is unavailable.

The physical table names are plural (`products`, `users`, `orders`) because `ORDER` is an SQL keyword.

```text
users (uid PK) ──────────────< orders (oid PK)
                                   │
                                   ├── uid  → users.uid
                                   └── pid  → products.pid

products (pid PK) ───────────< orders (oid PK)
```

| Table | Columns |
| --- | --- |
| `products` | `pid` BIGINT identity PK, `pname` TEXT, `description` TEXT, `price` NUMERIC(12,2), `qty` INTEGER |
| `users` | `uid` BIGINT identity PK, `uname` TEXT, `email` TEXT UNIQUE, `password` TEXT (bcrypt hash) |
| `orders` | `oid` BIGINT identity PK, `uid` BIGINT FK, `pid` BIGINT FK, `order_date` TIMESTAMPTZ |

Foreign keys use `ON DELETE RESTRICT`. A user or product referenced by an order cannot be deleted until that order is deleted, and the API returns **409 Conflict** with a clear message.

The order list endpoints use SQL joins to fetch user and product names so the UI can display `uname` and `pname` alongside `uid` and `pid`.

`public.users` and its `password` column belong to this application. They are separate from Supabase Auth (`auth.users`); the app currently has no login/session flow.

---

## API reference

Base URL: `http://localhost:5001/api`

Successful responses use `{ "data": ... }` and mutation responses also include a `message`. Validation errors use HTTP `422` with `{ "message": "...", "errors": { ... } }`.

### Products

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/get_products` | List all products |
| GET | `/api/get_product/:id` | Get one product by `pid` |
| POST | `/api/add_product` | Create a product |
| PUT | `/api/update/:id` | Update a product (the requested path) |
| PUT | `/api/update_product/:id` | Clear alias for product updates |
| DELETE | `/api/delete_product/:id` | Delete a product |

`PATCH` and `POST` are also accepted for update routes. Add product body:

```json
{
  "pname": "Wireless Headphones",
  "description": "Over-ear Bluetooth headphones",
  "price": 129.99,
  "qty": 24
}
```

### Users

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/get_users` | List all users (never returns passwords) |
| GET | `/api/get_user/:id` | Get one user by `uid` |
| POST | `/api/add_user` | Create a user |
| PUT | `/api/update_user/:id` | Update a user |
| DELETE | `/api/delete_user/:id` | Delete a user |

> **Endpoint note:** The requested API list contains `/api/update/:id` for both products and users. One URL cannot update two different resources, so `/api/update/:id` is the product endpoint and users use `/api/update_user/:id`.

Add user body:

```json
{
  "uname": "Alice Johnson",
  "email": "alice@example.com",
  "password": "password123"
}
```

On update, `password` is optional. Leave it blank in the UI to keep the existing password. Passwords are hashed with bcrypt and are excluded from all user responses.

### Orders

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/get_orders` | List all orders |
| GET | `/api/get_order/:id` | Get one order by `oid` |
| GET | `/api/get_orders/uid/:uid` | Orders for a user |
| GET | `/api/get_orders/pid/:pid` | Orders for a product |
| GET | `/api/get_orders?uid=1&pid=2` | Optional query filtering |
| POST | `/api/add_order` | Create an order |
| PUT | `/api/update_order/:id` | Update an order |
| DELETE | `/api/delete_order/:id` | Delete an order |

`/api/get_orders/uid?uid=1` and `/api/get_orders/pid?pid=2` are also supported for compatibility with the path style in the original endpoint list.

Add order body:

```json
{
  "uid": 1,
  "pid": 2,
  "order_date": "2026-11-06T14:30:00.000Z"
}
```

`order_date` is optional when creating an order and defaults to the current time. Both `uid` and `pid` must reference existing records.

### Health check

```http
GET /api/health
```

---

## Validation and safety

- Supabase credentials exist only on the server; the frontend sends requests to the local API.
- Field-level validation returns `422` responses with useful errors.
- Emails are normalized to lowercase and protected by a unique constraint.
- Products must have a non-negative price and a non-negative whole-number quantity.
- User passwords require at least 6 characters and are hashed with bcrypt.
- Referential integrity is enforced by PostgreSQL foreign keys.
- The API returns `404` for missing records and `409` for relationship conflicts or duplicate emails.
- RLS is enabled on all three tables with no public policies. The backend connects with the Supabase PostgreSQL owner role, which bypasses RLS.

---

## Optional: reset and reseed

Run this in the **Supabase SQL Editor** to clear all application rows:

```sql
truncate table
  public.orders,
  public.users,
  public.products
restart identity cascade;
```

Then seed again:

```powershell
cd C:\crud-test2\backend
npm run seed
```

Start the one-process production server from the project root:

```powershell
cd C:\crud-test2
npm start
```
