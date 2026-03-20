# EduAI — API Documentation

**Base URL:** `http://localhost:8000/api`

All responses follow the shape:
```json
{ "statusCode": 200, "data": { ... }, "message": "Success", "success": true }
```

Errors:
```json
{ "success": false, "message": "Error message", "errors": [] }
```

---

## Health

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/health` | — | Server health check |

**Response:**
```json
{ "status": "ok", "uptime": 123.45, "timestamp": "...", "dbStatus": "connected" }
```

---

## Auth

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/auth/register` | — | Register a new user |
| POST | `/auth/login` | — | Login and get tokens |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/logout` | Bearer | Logout (revoke refresh token) |

### POST `/auth/register`
**Body:**
```json
{
  "name": "Alice Smith",
  "email": "alice@example.com",
  "password": "password123",
  "role": "student"            // "student" | "teacher" (admin cannot self-register)
}
```

### POST `/auth/login`
**Body:**
```json
{
  "email": "alice@example.com",
  "password": "password123"
}
```
**Response:** `{ accessToken, user }` + `refreshToken` in httpOnly cookie.

### POST `/auth/refresh`
**Body (optional):** `{ "refreshToken": "..." }` — or reads from cookie automatically.

**Response:** `{ accessToken }` + rotated `refreshToken` cookie.

### POST `/auth/logout`
**Headers:** `Authorization: Bearer <accessToken>`

---

## Classrooms

All routes require `Authorization: Bearer <accessToken>`.

| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | `/classrooms` | Bearer | teacher | Create classroom |
| GET | `/classrooms` | Bearer | teacher | Get my classrooms |
| POST | `/classrooms/join` | Bearer | student | Join by code |
| GET | `/classrooms/:id` | Bearer | any | Get classroom details |
| GET | `/classrooms/:id/students` | Bearer | teacher | List students |
| PATCH | `/classrooms/:id/archive` | Bearer | teacher | Archive classroom |

### POST `/classrooms`
```json
{ "name": "CS 101", "subject": "Computer Science" }
```

### POST `/classrooms/join`
```json
{ "joinCode": "A1B2C3" }
```

---

## Assignments

All routes require `Authorization: Bearer <accessToken>`.

| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | `/assignments` | Bearer | teacher | Create assignment |
| GET | `/assignments/classroom/:classroomId` | Bearer | any | Get by classroom |
| GET | `/assignments/:id` | Bearer | any | Get by ID |
| PATCH | `/assignments/:id` | Bearer | teacher | Update assignment |
| PATCH | `/assignments/:id/publish` | Bearer | teacher | Publish (draft → published) |
| DELETE | `/assignments/:id` | Bearer | teacher | Delete (draft only) |

### POST `/assignments`
```json
{
  "title": "Variables Essay",
  "description": "Write about variables...",
  "classroom": "<classroomId>",
  "dueDate": "2026-04-20T00:00:00.000Z",
  "rubric": [
    { "criterion": "Understanding", "description": "...", "maxMarks": 10 },
    { "criterion": "Examples", "description": "...", "maxMarks": 10 }
  ]
}
```

### PATCH `/assignments/:id`
Any subset of: `title`, `description`, `dueDate`, `rubric` (rubric locked if submissions exist).

---

## Submissions

All routes require `Authorization: Bearer <accessToken>`.

| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | `/submissions` | Bearer | student | Submit (multipart/form-data) |
| GET | `/submissions/assignment/:assignmentId` | Bearer | teacher | All submissions for assignment |
| GET | `/submissions/my/:assignmentId` | Bearer | student | My submission |
| GET | `/submissions/student/all` | Bearer | student | All my submissions |
| GET | `/submissions/:id` | Bearer | any | Single submission |

### POST `/submissions`
**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | PDF, DOCX, JPEG, or PNG (max 10MB) |
| `assignmentId` | String | Assignment ObjectId |

**Response:** Submission with `status: "pending"`. Grading runs asynchronously.

---

## Analytics

All routes require `Authorization: Bearer <accessToken>`.

| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| GET | `/submissions/analytics/classroom/:classroomId` | Bearer | teacher | Classroom stats |
| GET | `/submissions/analytics/assignment/:assignmentId` | Bearer | teacher | Assignment stats + heatmap |
| GET | `/submissions/analytics/my-progress` | Bearer | student | Personal progress |

### Classroom Analytics Response
```json
{
  "totalAssignments": 5,
  "totalSubmissions": 20,
  "submissionRate": 80,
  "classAverage": 72.5,
  "assignmentBreakdown": [
    { "assignmentId": "...", "title": "...", "submissionCount": 4, "averageScore": 75.0, "submissionRate": 80 }
  ]
}
```

### Assignment Analytics Response
```json
{
  "criterionAverages": [{ "criterion": "Understanding", "averageScore": 7.5, "maxMarks": 10 }],
  "scoreDistribution": { "0-40%": 1, "41-60%": 2, "61-80%": 5, "81-100%": 2 },
  "submissionCount": 10, "gradedCount": 8, "pendingCount": 1, "errorCount": 1
}
```

### Student Progress Response
```json
{
  "scoreHistory": [{ "assignmentTitle": "...", "submittedAt": "...", "score": 25, "maxMarks": 30, "percentage": 83.33 }],
  "criterionStrengths": [{ "criterion": "Understanding", "averageScore": 8.5, "maxMarks": 10 }],
  "overallAverage": 78.5
}
```

---

## Notifications

All routes require `Authorization: Bearer <accessToken>`.

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/notifications/stream` | Bearer | SSE live stream |
| GET | `/notifications` | Bearer | Last 50 notifications |
| PATCH | `/notifications/read-all` | Bearer | Mark all as read |
| PATCH | `/notifications/:id/read` | Bearer | Mark one as read |

### SSE Stream
Connect via EventSource. Events:
- `connected` — initial connection confirmed
- `grading_complete` — submission graded
- `new_assignment` — new assignment published

---

## AI Grading

| Method | URL | Auth | Role | Description |
|--------|-----|------|------|-------------|
| POST | `/grading/retry/:submissionId` | Bearer | teacher | Retry failed grading |

---

## Admin

All routes require `Authorization: Bearer <accessToken>` + `admin` role.

| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/admin/users` | Bearer (admin) | List users (paginated) |
| PATCH | `/admin/users/:id/role` | Bearer (admin) | Change user role |
| DELETE | `/admin/users/:id` | Bearer (admin) | Delete user |
| GET | `/admin/stats` | Bearer (admin) | Platform stats |

### GET `/admin/users`
**Query params:** `role`, `search`, `page` (default 1), `limit` (default 20)

### PATCH `/admin/users/:id/role`
```json
{ "role": "teacher" }
```
**Safeguards:** Cannot change own role. Cannot change another admin's role.

### GET `/admin/stats`
```json
{
  "totalUsers": 8, "studentCount": 5, "teacherCount": 1, "adminCount": 1,
  "totalClassrooms": 1, "activeClassrooms": 1,
  "totalAssignments": 2, "publishedAssignments": 2,
  "totalSubmissions": 3, "gradedSubmissions": 2, "pendingSubmissions": 1,
  "gradingSuccessRate": 100
}
```

---

## Seed Data

Run: `node src/scripts/seed.js` (or `node src/scripts/seed.js --dry-run`)

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@eduai.com | Password123 | admin |
| Teacher | teacher@eduai.com | Password123 | teacher |
| Alice | alice@eduai.com | Password123 | student |
| Bob | bob@eduai.com | Password123 | student |
| Charlie | charlie@eduai.com | Password123 | student |
| Diana | diana@eduai.com | Password123 | student |
| Edward | edward@eduai.com | Password123 | student |
