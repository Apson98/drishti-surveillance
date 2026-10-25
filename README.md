# Drishti Surveillance — website + admin

React 18 + TypeScript + Three.js (React Three Fiber) + GLSL + SCSS on the front end,
Node.js + Express + SQLite on the back end.

- **Website**: 3D hero, services, product catalogue with a running total, coverage planner,
  client logos, and appointment booking.
- **Admin dashboard** (`/#admin`): see and update appointments, add/edit products with photo
  and price, add/edit client logos.

## 1. First-time setup

You need **Node.js 22.13 or newer** (the current LTS from nodejs.org is fine).

```bash
npm install
cp .env.example .env        # on Windows: copy .env.example .env
```

Open `.env` and set:

```
ADMIN_PASSWORD=your-strong-password
SESSION_SECRET=any-long-random-text
```

## 2. Run it on your computer

```bash
npm run dev
```

- Website: http://localhost:5173
- Admin: http://localhost:5173/#admin (sign in with `ADMIN_PASSWORD`)

On first start the database is created in `data/drishti.db` with the starting products and clients.
Uploaded photos are saved in `uploads/`.

## 3. Put it online

This site has a backend, so it needs a host that runs Node.js
(for example Render, Railway, a VPS, or cPanel hosting with "Setup Node.js App").
Drag-and-drop hosts like Netlify Drop cannot run the backend.

```bash
npm install
npm run build      # builds the website into dist/
npm start          # serves the website + API on PORT (default 4000)
```

Set `ADMIN_PASSWORD`, `SESSION_SECRET` and `PORT` as environment variables on the host
(or in `.env`). Keep the `data/` and `uploads/` folders on persistent storage and back them up:
they hold your products, clients, appointments and photos.

## 4. Edit fixed text

Company phone, email, address, hours, services and process steps are in **`src/content.ts`**.
Products and clients are managed from the admin dashboard, not in code.

## Structure

```
server/
  index.ts        Express API, uploads, serves the built site
  db.ts           SQLite tables (products, clients, appointments) + first-run seed
  auth.ts         admin password sign-in with a signed cookie
src/
  Site.tsx        the public website
  admin/          admin dashboard (appointments, products, clients)
  components/     website sections (Shop, CartDrawer, Booking, Clients, Hero, ...)
  data/           shared types, API client, starting catalogue (seed.ts)
  store/          selection (cart) and catalogue state
  scenes/         Three.js scenes (hero lens, coverage planner)
  shaders/        GLSL
public/seed/      starting product photos and client logos
```

## API

| Method | Path | Who |
|---|---|---|
| GET | /api/products, /api/clients | public |
| POST | /api/appointments | public (prices are recalculated on the server) |
| POST | /api/admin/login, /api/admin/logout | admin |
| GET/POST/PUT/DELETE | /api/admin/products[/:id] | admin |
| POST/PUT/DELETE | /api/admin/clients[/:id] | admin |
| GET/PATCH/DELETE | /api/admin/appointments[/:id] | admin |
| POST | /api/admin/upload | admin (images up to 5 MB) |
