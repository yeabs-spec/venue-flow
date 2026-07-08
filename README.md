# VenueFlow

VenueFlow is a meeting-room booking service built as a Web Programming II capstone sample. Members can register, browse available meeting rooms, and submit booking requests through a separate frontend that consumes a REST API. Administrators can manage room inventory, approve or reject requests, and monitor scheduling activity.

## Features

- Professional multi-view frontend with Home, Rooms, Room Details, Member Dashboard, and Admin pages
- JWT-based authentication for login sessions
- Role-based authorization for member and admin workflows
- Password hashing with `bcryptjs`
- RESTful API built with `Node.js` and `Express.js`
- Focused meeting-room booking workflow instead of a generic reservation marketplace
- MVC project structure with separate routes, controllers, and models
- Relational SQLite database with DDL included in the repository
- Booking conflict detection to avoid overlapping reservations
- Room profiles with description text and image previews
- Request logging and application logging written to disk
- Input validation, security headers, and API rate limiting

## Technology Stack

- Backend: `Node.js`, `Express.js`
- Frontend: `HTML`, `CSS`, `Vanilla JavaScript`
- Database: `SQLite`
- Security: `jsonwebtoken`, `bcryptjs`, `helmet`, `express-rate-limit`
- Validation and logging: `express-validator`, `morgan`

## Project Structure

```text
venueflow/
|- database/
|  |- schema.sql
|- public/
|  |- app.js
|  |- index.html
|  |- styles.css
|- src/
|  |- config/
|  |- controllers/
|  |- middleware/
|  |- models/
|  |- routes/
|  |- utils/
|- .env.example
|- package.json
|- server.js
```

## Setup Instructions

1. Install dependencies:

   ```bash
   npm install
   ```

   If you typed `nmp install`, use `npm install` instead.

2. Copy environment variables:

   ```bash
   copy .env.example .env
   ```

3. Start the application:

   ```bash
   npm start
   ```

4. Open the app in your browser:

   [http://localhost:3000](http://localhost:3000)

On first startup, the application automatically:

- creates the SQLite database in `data/venueflow.db`
- runs the DDL from [database/schema.sql](/C:/Users/yeab/Documents/final%20assignment/database/schema.sql)
- seeds a default administrator account
- seeds sample meeting rooms

## Default Admin Account

Use these credentials to log in as the seeded administrator after the first startup:

- Email: `admin@venueflow.local`
- Password: `Admin123!`

## Core API Endpoints

- `POST /api/auth/register` - create a member account
- `POST /api/auth/login` - authenticate and receive a JWT
- `GET /api/auth/me` - fetch the currently logged-in user
- `GET /api/rooms` - list meeting rooms
- `GET /api/rooms/:id` - fetch a single meeting room with full details
- `POST /api/rooms` - create a meeting room as an admin
- `PUT /api/rooms/:id` - update a meeting room as an admin
- `DELETE /api/rooms/:id` - delete a meeting room as an admin
- `GET /api/bookings/my` - list the current member's bookings
- `GET /api/bookings` - list all bookings as an admin
- `POST /api/bookings` - submit a booking request
- `PATCH /api/bookings/:id/status` - approve or reject a booking as an admin
- `PATCH /api/bookings/:id/cancel` - cancel a booking
- `GET /api/bookings/summary` - dashboard summary metrics

## Database DDL and Schema

- DDL: [database/schema.sql](/C:/Users/yeab/Documents/final%20assignment/database/schema.sql)
- Schema overview and ER diagram: [docs/schema.md](/C:/Users/yeab/Documents/final%20assignment/docs/schema.md)

## Extra Features Beyond The Core Brief

- Input validation using `express-validator`
- API rate limiting using `express-rate-limit`
- Security headers using `helmet`
- Booking conflict detection for overlapping meeting time slots
- Dedicated room detail pages with images and richer descriptions
- Auto-seeded sample data for quick demonstration

## Notes

- Log files are written to `logs/access.log`, `logs/app.log`, and `logs/error.log`
- The frontend is intentionally separated from server-side templating and communicates with the backend via `fetch`
- The current implementation uses SQLite for easy local setup while still satisfying the relational database requirement
- The product scope is intentionally focused on meeting-room booking so the workflows stay specific and coherent
