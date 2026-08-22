# Dayflow HRMS — Documentation

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Gemini API Key (optional, for AI features)

### Backend Setup
```bash
cd backend
cp .env.example .env     # Edit with your MongoDB URI & secrets
npm install
npm run seed             # Seed demo data
npm run dev              # Start on port 5000
```

### Frontend Setup
```bash
cd frontend
cp .env.example .env     # Edit API URL if needed
npm install
npm run dev              # Start on port 5173
```

### Demo Credentials (after seeding)
Set the following values in `backend/.env` before running the seed script:

- `ADMIN_SEED_PASSWORD`
- `EMPLOYEE_SEED_PASSWORD`

| Role | Email | Password source |
|------|-------|-----------------|
| Admin | admin@dayflow.com | admin@123 |
| Employee | rahul@dayflow.com | `EMPLOYEE_SEED_PASSWORD` |

> All employees have `isFirstLogin: true` — they'll be prompted to change password on first login.

---

## Architecture

```
User → React Frontend → Express REST API → Auth + RBAC → Business Services → Mongoose → MongoDB
                                                                            ↓
                                                                    Gemini API (AI features)
```

- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Backend**: Express.js + Mongoose + JWT + bcrypt
- **Database**: MongoDB with 11 collections
- **AI**: Google Gemini API (backend-only)

### Key Principles
- Frontend communicates ONLY through REST APIs
- All business logic lives in backend services
- Backend enforces all authorization (RBAC + ownership)
- Gemini API key never reaches the frontend
- Passwords hashed with bcrypt (12 rounds)

---

## API Endpoints (45+)

### Auth (`/api/v1/auth`)
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | /login | No | — |
| POST | /logout | Yes | Any |
| POST | /change-password | Yes | Any |
| POST | /forgot-password | No | — |
| POST | /reset-password | No | — |

### Employees (`/api/v1/employees`)
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | / | Yes | Admin |
| POST | / | Yes | Admin |
| GET | /:id | Yes | Admin |
| PUT | /:id | Yes | Admin |
| PATCH | /:id/status | Yes | Admin |
| POST | /:id/reset-credentials | Yes | Admin |

### Profile (`/api/v1/profile`)
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | /me | Yes | Any |
| PUT | /me | Yes | Any (restricted fields for employee) |

### Attendance (`/api/v1/attendance`)
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | /check-in | Yes | Employee |
| POST | /check-out | Yes | Employee |
| GET | /me | Yes | Employee |
| GET | / | Yes | Admin |
| GET | /reports | Yes | Admin |

### Leave (`/api/v1/leaves`)
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | / | Yes | Employee |
| GET | /me | Yes | Employee |
| GET | /balance/me | Yes | Employee |
| GET | / | Yes | Admin |
| PATCH | /:id/approve | Yes | Admin |
| PATCH | /:id/reject | Yes | Admin |
| GET | /balance | Yes | Admin |
| PUT | /balance/:employeeId | Yes | Admin |

### Salary (`/api/v1/salary`)
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | /me | Yes | Employee |
| GET | /employees/:id | Yes | Admin |
| PUT | /employees/:id | Yes | Admin |
| GET | /history/:employeeId | Yes | Admin |

### Documents, Notifications, Reports, Audit, AI
See route files for complete endpoint listing.

---

## Database Collections (11 models)
User, Employee, Attendance, LeaveType, LeaveBalance, LeaveRequest, SalaryStructure, SalaryHistory, Document, Notification, AuditLog
