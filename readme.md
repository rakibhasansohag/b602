# Vehicle Rental System

**Maintainer:** Rakib Hasan Sohag

---

## Project & Live URL

**Project name:** Vehicle Rental System (backend)

**Live URL:** [Live URL](https://b602-express-vehechile.vercel.app/)

---

## Overview

A modular, TypeScript-based backend API for managing vehicle rentals. The API supports users (admin/customer), vehicles, and bookings with robust business rules: role-based access control, booking overlap prevention, transactional deletes, and an auto-return cron job.

This README gives a quick project overview, folder map, API routes and examples, setup instructions, and operational notes.

---

## Features

* User signup / signin with hashed passwords (bcrypt) and JWT authentication
* Role-based authorization (admin vs customer)
* Vehicles CRUD (admin-only for create/update/delete)
* Bookings: create, view (role-based), cancel (customer before start), mark returned (admin)
* Prevent overlapping bookings and blocking delete when active bookings exist
* Transactional operations using `FOR UPDATE` locks to prevent race conditions
* Auto-return cron job to mark expired bookings as `returned`
* Input validation (Zod) and clear error responses

---

## Technology stack

* Node.js + TypeScript
* Express.js
* PostgreSQL (pg)
* bcryptjs (password hashing)
* jsonwebtoken (JWT)
* node-cron (scheduled tasks)
* Zod (request validation)

---

## Project layout (important files)

```
src/
├─ app.ts                 # Express app, middlewares, routes
├─ server.ts              # server bootstrap (listen)
├─ config/
│  ├─ index.ts            # env config
│  └─ db.ts               # pg Pool + initDB()
├─ middleware/
│  ├─ auth.ts             # JWT auth + role checks
│  └─ logger.ts           # request logger
├─ modules/
│  ├─ auth/
│  │  ├─ auth.controller.ts
│  │  ├─ auth.service.ts
│  │  └─ auth.route.ts
│  ├─ users/
│  │  ├─ user.controller.ts
│  │  ├─ user.service.ts
│  │  └─ user.route.ts
│  │  └─ types.ts
│  ├─ vehicles/
│  │  ├─ vehicle.controller.ts
│  │  ├─ vehicle.service.ts
│  │  └─ vehicle.route.ts
│  │  └─ types.ts
│  └─ bookings/
│     ├─ booking.controller.ts
│     ├─ booking.service.ts
│     └─ booking.route.ts
│     └─ types.ts
└─ utils/
   └─ cron.ts             # startCronJobs() - auto-return job
```

> **Where routes live:** each feature has a `*.route.ts` under `src/modules/<feature>/` and mounted in `app.ts`:
>
> * `/api/v1/auth` → `src/modules/auth/auth.route.ts`
> * `/api/v1/users` → `src/modules/users/user.route.ts`
> * `/api/v1/vehicles` → `src/modules/vehicles/vehicle.route.ts`
> * `/api/v1/bookings` → `src/modules/bookings/booking.route.ts`

---

## Database schema (Postgres) — quick reference

**users**

* id SERIAL PRIMARY KEY
* name VARCHAR(255) NOT NULL
* email VARCHAR(255) NOT NULL UNIQUE
* password VARCHAR(255) NOT NULL
* phone VARCHAR(15)
* role VARCHAR(55) NOT NULL -- `admin` | `customer`
* created_at TIMESTAMP DEFAULT NOW()
* updated_at TIMESTAMP DEFAULT NOW()

**vehicles**

* id SERIAL PRIMARY KEY
* vehicle_name VARCHAR(255) NOT NULL
* type VARCHAR(50) NOT NULL -- `car` | `bike` | `van` | `suv`
* registration_number VARCHAR(255) UNIQUE NOT NULL
* daily_rent_price NUMERIC NOT NULL
* availability_status VARCHAR(20) NOT NULL -- `available` | `booked`
* created_at TIMESTAMP DEFAULT NOW()
* updated_at TIMESTAMP DEFAULT NOW()

**bookings**

* id SERIAL PRIMARY KEY
* customer_id INT REFERENCES users(id) ON DELETE CASCADE
* vehicle_id INT REFERENCES vehicles(id) ON DELETE CASCADE
* rent_start_date DATE NOT NULL
* rent_end_date DATE NOT NULL
* total_price NUMERIC NOT NULL
* status VARCHAR(20) NOT NULL -- `active` | `cancelled` | `returned`
* created_at TIMESTAMP DEFAULT NOW()
* updated_at TIMESTAMP DEFAULT NOW()

---

## API Reference — quick examples

Base URL: `http://localhost:5000/api/v1`

### Auth

**Signup**

* `POST /auth/signup`
* Body: `{ name, email, password, phone }` (role is forced to `customer` for public signup)
* Success: `201 Created` → returns user (no password)

**Signin**

* `POST /auth/signin`
* Body: `{ email, password }`
* Success: `200 OK` → `{ token, user }`

### Vehicles

**Create** (admin only)

* `POST /vehicles` (Auth: Bearer token)
* Body: `{ vehicle_name, type, registration_number, daily_rent_price, availability_status }`

**Get all**

* `GET /vehicles` (public)

**Get by id**

* `GET /vehicles/:vehicleId` (public)

**Update** (admin only)

* `PUT /vehicles/:vehicleId` (Auth)

**Delete** (admin only)

* `DELETE /vehicles/:vehicleId` — fails if there are active bookings for that vehicle

### Bookings

**Create booking**

* `POST /bookings` (Auth required)
* Body: `{ customer_id, vehicle_id, rent_start_date, rent_end_date }`
* Business rules:

  * prevents overlapping bookings for same vehicle
  * calculates `total_price = daily_rent_price * number_of_days`
  * sets vehicle status to `booked` when appropriate

**Get bookings**

* `GET /bookings` (Admin sees all; customer sees own bookings)

**Update booking (status changes)**

* `PUT /bookings/:bookingId` (Auth)
* Customer can `cancel` **before** the start date
* Admin can mark `returned` anytime

---

## Environment (`.env`) example

```
PORT=5000
CONNECTION_STRING=postgresql://user:password@localhost:5432/vehicle_rental
JWT_SECRET=your_jwt_secret_here
```

---

## Setup & running (development)

1. Clone project and `cd` into it.
2. Copy `.env.example` → `.env` and fill values.
3. Install dependencies:

```bash
npm install
```

4. Start the server (dev):

```bash
npm run dev
```

5. App will initialize DB tables automatically (see `src/config/db.ts`).

**Run cron jobs**

* Cron is started automatically by `startCronJobs()` in `app.ts`.
* Default schedule: daily at `00:05 UTC`. For development, change schedule in `src/utils/cron.ts` to a faster interval like `'* * * * *'` (every minute) then restart.

---

## Important notes & security

* **Public signup** sets role = `customer`. Creating `admin` accounts should be done by an existing admin endpoint or directly in DB (only for setup).
* **Transactions & locks:** deletions use transactions and `FOR UPDATE` to prevent race conditions when checking active bookings.
* **Testing:** the codebase includes robust services; consider adding Jest + Supertest integration tests (recommended for CI).

---

## Contributing

* Follow the same module pattern when adding new features: route → controller → service.
* Keep controllers for auth/authorization + request validation; services for DB logic & transactions.

---




