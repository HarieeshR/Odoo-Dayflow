# Dayflow — Employee Portal (Frontend Only)

A complete, working React frontend for the Dayflow HRMS Employee side. No login/signup screens — the app assumes an already-authenticated employee, per the spec, and boots straight into the Employee Dashboard.

## Stack
- React 19 + Vite
- React Router 7
- Tailwind CSS v4
- Recharts (weekly hours chart)
- lucide-react (icons)

## Data layer
This is a **frontend-only** deliverable (no backend/database, as requested). All "API calls" live in `src/services/api.js` and are async, latency-simulated, and validate business rules (duplicate check-in, invalid leave dates, overlapping leave, read-only salary, etc.) — exactly like real REST handlers would. They read/write to an in-memory "database" (`src/services/db.js`) that's persisted to `localStorage` so your changes survive a refresh.

Because every component only ever talks to `services/api.js`, swapping this out for real `fetch()` calls to your actual backend later requires **no changes to any page or component** — just rewrite the functions inside `api.js`.

## Run it
```bash
npm install
npm run dev
```

## Build it
```bash
npm run build
```
Output goes to `dist/`.

## What's included
- Employee Dashboard (live check-in/out, today's attendance, stat cards, recent leave + activity)
- My Profile (personal/job/salary info, edit phone+address+photo, salary is read-only)
- Attendance (summary cards, weekly chart, filterable history table, custom date range)
- Time Off (leave balance, apply modal with day auto-calc + validation, history, cancel pending)
- Payroll (current salary breakdown, salary history, payslip download stub)
- Documents (document list with view/download, document request flow)
- Notifications (unread count, mark as read / mark all, filter, deep-links to related pages)
- Policies (searchable, filterable, expandable policy list)
- Settings (account info, change password, notification toggles, appearance)
- Logout (clears session, hands off to your app's existing auth entry point)

Every page has loading skeletons, error states with retry, and empty states.

## Wiring to your real backend
Replace the bodies of the functions in `src/services/api.js` with real `fetch`/`axios` calls to the endpoints listed in the Dayflow master plan (`GET /api/employee/me`, `POST /api/attendance/check-in`, etc.), and remove `services/db.js`. No other file needs to change.

## Reset demo data
Open the browser console and run:
```js
localStorage.removeItem('dayflow_employee_db_v1')
```
then refresh.
