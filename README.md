# Notes SaaS API 🚀

A production-ready, secure RESTful API built for modern SaaS applications. Featuring **JWT Authentication**, **Role-Based Access Control (RBAC)**, **Strict Data Isolation (anti-IDOR)**, **External API Integration**, **Rate Limiting**, and **Comprehensive Automated Testing**.

---

## 📋 Features

- 🔐 **Authentication & Security**:
  - Secure User Registration & Login with **JWT** (`jsonwebtoken`).
  - Passwords hashed using industry-standard **bcrypt** (salt rounds: 10).
  - **Mass Assignment / Privilege Escalation Protection**: Users cannot self-promote to `ADMIN` during registration.
  - **Rate Limiting**: Brute-force protection on the `/api/auth/login` endpoint (using `express-rate-limit`).
  - **Security Headers**: Standard security headers implemented via `helmet`.
  - **Input Validation**: Strict schema validation using `zod` for request bodies, URL params, and query strings.
  - **Zero Hardcoded Secrets**: All keys, secrets, and environment parameters loaded and validated strictly via `.env`.

- 👥 **Role-Based Access Control (RBAC) & Ownership**:
  - **USER**: Can only view, create, edit, and delete their own notes.
  - **ADMIN**: Can view and manage all notes across the platform.
  - **Insecure Direct Object Reference (IDOR) Protection**: Direct note queries enforce ownership checks and return `404 Not Found` for unauthorized IDs to prevent resource enumeration.

- 🌐 **External API Integration**:
  - Protected endpoint (`/api/external/rates`) providing live financial exchange rates.
  - Requires valid JWT authorization.
  - API keys injected strictly via environment variables with zero code exposure and graceful fallback.

- 🧪 **Automated Testing & Code Quality**:
  - Fully typed with **TypeScript**.
  - 100% passing automated test suite (**24 unit & integration tests**) with **Jest** and **Supertest**.
  - Database powered by **Prisma ORM** with **SQLite** for zero-friction local setup (no external DB container needed).

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **Framework**: Express.js
- **ORM / Database**: Prisma ORM with SQLite
- **Validation**: Zod
- **Security**: Helmet, CORS, Bcryptjs, JsonWebToken, Express-Rate-Limit
- **Testing**: Jest, Supertest, Ts-Jest

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed on your machine:
```bash
node -v
npm -v
```

### 2. Clone and Install Dependencies
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd NotesProject
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
Default configuration values in `.env`:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET=super_secret_jwt_development_key_minimum_32_characters_long_12345
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_ATTEMPTS=5
EXTERNAL_API_KEY=mock_dev_key
EXTERNAL_API_URL=https://v6.exchangerate-api.com/v6
```

### 4. Setup Database and Seed Initial Data
Run Prisma push to initialize the SQLite database file (`dev.db`), then run the seed script:
```bash
# Push schema to SQLite
npm run db:push

# Seed admin and test users with sample notes
npm run db:seed
```

#### Pre-seeded Credentials:
| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@example.com` | `Admin12345!` | Full system visibility (all notes) |
| **USER** | `alice@example.com` | `User12345!` | Personal notes only |
| **USER** | `bob@example.com` | `User12345!` | Personal notes only |

### 5. Run the Server

**Development Mode (with hot-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm run build
npm start
```
The server will start at: `http://localhost:4000/api`

---

## 🧪 Running Automated Tests

Run the complete Jest test suite covering Auth, IDOR protection, RBAC, External API, and Rate Limiting:
```bash
npm test
```
To run tests with coverage reporting:
```bash
npm run test:coverage
```

---

## 📚 API Documentation & Endpoints

### 1. Health Check
- **`GET /api/health`**
  - Public endpoint to verify service status.
  - **Response (200 OK)**:
    ```json
    {
      "status": "ok",
      "timestamp": "2026-10-29T19:50:45.856Z",
      "service": "notes-saas-api"
    }
    ```

---

### 2. Authentication (`/api/auth`)

#### `POST /api/auth/register`
Register a new user account. Defaults role to `USER`.
- **Request Body**:
  ```json
  {
    "email": "developer@example.com",
    "password": "StrongPassword123!"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully",
    "data": {
      "id": "18f9df08-2089-42b7-a36c-92b0f4bc5bc0",
      "email": "developer@example.com",
      "role": "USER",
      "createdAt": "2026-10-29T19:55:00.000Z"
    }
  }
  ```

#### `POST /api/auth/login`
Authenticate and obtain a JWT bearer token. Protected by rate limiting (5 attempts / 15 mins).
- **Request Body**:
  ```json
  {
    "email": "alice@example.com",
    "password": "User12345!"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "ccd3b685-80bf-45f7-9de1-4ac93121c51e",
        "email": "alice@example.com",
        "role": "USER"
      }
    }
  }
  ```

---

### 3. Notes Management (`/api/notes`)
*Requires header:* `Authorization: Bearer <TOKEN>`

#### `GET /api/notes`
- **USER**: Returns only notes created by the authenticated user.
- **ADMIN**: Returns all notes from all users with creator email.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "count": 2,
      "scope": "USER_ONLY (Personal view)",
      "notes": [
        {
          "id": "e6a14e9e-5b23-42e7-91a1-f3b143aa2b19",
          "title": "Alice's Secret Note",
          "content": "This note belongs to Alice.",
          "userId": "ccd3b685-80bf-45f7-9de1-4ac93121c51e",
          "createdAt": "2026-10-29T19:47:58.000Z"
        }
      ]
    }
  }
  ```

#### `POST /api/notes`
Create a new note.
- **Request Body**:
  ```json
  {
    "title": "Quarterly Objectives",
    "content": "Deliver high quality SaaS software on time."
  }
  ```
- **Response (201 Created)**

#### `GET /api/notes/:id`
Fetch a specific note by ID.
- Protected by ownership verification: non-admins cannot retrieve other users' notes (returns `404 Not Found`).

#### `PUT /api/notes/:id`
Update an existing note (title and/or content).
- **Request Body**:
  ```json
  {
    "title": "Updated Title",
    "content": "Updated content."
  }
  ```
- **Response (200 OK)**

#### `DELETE /api/notes/:id`
Delete a note.
- Users can delete only their own notes; Admin can delete any note.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Note deleted successfully"
  }
  ```

---

### 4. External API Integration (`/api/external`)
*Requires header:* `Authorization: Bearer <TOKEN>`

#### `GET /api/external/rates?base=USD`
Fetches live or fallback currency exchange rates. Securely uses `EXTERNAL_API_KEY` from environment variables.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "External exchange rates fetched successfully",
    "data": {
      "source": "live_external_api",
      "base_code": "USD",
      "conversion_rates": {
        "EUR": 0.92,
        "GBP": 0.79,
        "SAR": 3.75,
        "AED": 3.67
      },
      "last_updated_utc": "Thu, 29 Oct 2026 19:00:00 +0000"
    }
  }
  ```

---

## 🔒 Security Best Practices Implemented

1. **Privilege Escalation Prevention (Mass Assignment)**:
   The registration DTO deliberately omits `role`. Registration requests are forced to `USER` in service logic.
2. **Strict Insecure Direct Object Reference (IDOR) Mitigation**:
   Database queries for individual resources verify both `id` and `userId` ownership. If a user attempts to target another user's note ID, the API returns `404 Not Found` rather than `403 Forbidden` to prevent object identifier enumeration.
3. **Password Security**:
   Passwords hashed using `bcrypt` with salt cost 10. Password strings and hashes are strictly excluded from all API responses.
4. **Brute Force Protection**:
   `express-rate-limit` limits repeated login attempts to 5 attempts per 15-minute window per IP.
5. **No Hardcoded Secrets**:
   Environment variables are verified via a strict `zod` schema at server initialization. Missing or weak configurations immediately abort startup with clear diagnostic logs.
6. **SQL Injection Immunity**:
   Prisma ORM automatically uses parameterized queries, eliminating SQL injection vectors.

---

## 🗄 Database Management

To visually inspect the database contents using Prisma Studio:
```bash
npm run db:studio
```
Opens in your browser at `http://localhost:5555`.

---

## 📄 License
ISC License. Built for Autoaimagix Technical Assessment.

