# AI Club Recruitment Test Platform

A full admin-controlled online testing platform: MongoDB + Express + Node backend, React (Vite + Tailwind) frontend, with a modern cyan/navy "AI Club" SaaS-dashboard design system.

No demo data, no self-registration, no hardcoded questions. Everything — students, questions, and tests — is created by the administrator.

## What's included

- **Admin-only student accounts**: admin creates/edits/disables/deletes students, resets passwords, bulk-imports via CSV/Excel with a downloadable template.
- **Admin-only question bank**: full CRUD, view/duplicate, activate/deactivate, category + difficulty + year tagging, bulk import/export, live counts per year/difficulty.
- **Test configuration**: a 4-step wizard (Details → Difficulty Distribution → Question Selection → Review & Publish) covering year, question count, duration, marks, random or manual question selection, difficulty split, and negative marking. A test cannot go **Active** unless the backend validation passes (enough active questions, valid answers, correct year, duration > 0).
- **Admin analytics**: score distribution, participation per test, and question-bank composition, all computed from real data (no fabricated metrics).
- **Student flow**: students log in with credentials issued by the admin, see only the test for their assigned year, and cannot change their year. Dashboard, Available Tests, My Tests, Results and Profile are all separate pages with a responsive nav (sidebar-style top nav on desktop, bottom tab bar on mobile).
- **Distraction-free test-taking**: sticky timer with a low-time warning, question navigator with Answered/Marked-for-review/Unanswered states, Previous/Mark for Review/Clear Answer/Next controls, auto-save per answer, confirmation before submit, and auto-submit at zero with a warning before accidental tab close. Starting a test snapshots the question set for that attempt — refreshing does **not** re-randomize it.
- **Security**: `correctAnswer` is never sent to the browser. All scoring happens server-side when the student submits. Passwords are bcrypt-hashed; nothing is ever stored or re-displayed in plaintext except once, immediately after creation/reset.
- **Results**: ranked, filterable, exportable, with a selection-status workflow (Pending → Shortlisted/Selected/Rejected). Students see their own rank and breakdown without ever being shown correct answers.

## About this redesign

This is a UI/UX redesign layered on the original working platform. Existing database schema, authentication, authorization, test-evaluation logic, question storage, and result calculation are all unchanged. Two small **additive, read-only** endpoints were added so students can see their own history/results (they didn't exist before and nothing existing was altered):

- `GET /api/attempts/history` — a student's own past/current attempts (used by the "My Tests" page).
- `GET /api/my-results` — a student's own results with their rank among that test's participants (used by the "Results" page). Mounted separately from the existing admin-only `/api/results`, so that route's contract is untouched.

Everything else — routes, request/response shapes, scoring, validation — is exactly as before.

## Project structure

```
exam-platform/
  backend/     Express API + Mongoose models
  frontend/    React (Vite) admin + student UI
```

## Prerequisites

- Node.js 18+
- A MongoDB database (local install or a free Atlas cluster)

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
MONGO_URI=mongodb://localhost:27017/exam_platform
JWT_SECRET=<generate a long random string>
INITIAL_ADMIN_EMAIL=admin@aiclub.edu
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=<choose a strong password>
```

Create the **one** initial administrator account (this is the only account ever seeded — no demo students, no demo questions):

```bash
npm run create-admin
```

Start the API:

```bash
npm run dev        # nodemon, auto-restart
# or
npm start
```

The API runs on `http://localhost:5000` by default.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` to the backend automatically (see `vite.config.js`).

- Student login: `http://localhost:5173/login`
- Admin login: `http://localhost:5173/admin/login`

## 3. First-time admin workflow

1. Log in at `/admin/login` with the credentials from `npm run create-admin`.
2. **Students** → Add Student (or Import Students) to create accounts. Roll number, email, and username must be unique; passwords are bcrypt-hashed and shown only once.
3. **Question Bank** → Add Question or Bulk Import to build up questions per year/category/difficulty. Only **Active** questions count toward a test.
4. **Tests** → Create Test opens the 4-step wizard: Details → Difficulty Distribution → Question Selection (Random or Manual, with search/filter/preview) → Review & Publish. **Save Draft** stores the config; **Publish Test** saves and activates it in one step. If there aren't enough active questions for that year (or the difficulty split doesn't add up), activation is blocked with a specific error message — exactly as specified.
5. Students in that academic year can now log in and see **Start Test** on their dashboard. Years with no active test see: *"No questions have been added for this test yet. Please contact the administrator."*
6. **Results** → view ranked scores per test, filter by minimum percentage or selection status, mark students Shortlisted/Selected/Rejected, export to CSV.
7. **Analytics** → score distribution, participation, and question-bank composition at a glance. **Categories** → question counts per category. **Settings** → change the admin password.

## Notes on production deployment

- Set `CLIENT_ORIGIN` in the backend `.env` to your deployed frontend URL (CORS).
- Run `npm run build` in `frontend/` and serve the `dist/` folder from your web host or CDN, pointing API calls at your deployed backend URL (adjust `vite.config.js`'s proxy or add a full base URL in `src/api/client.js` for production).
- Use a real MongoDB Atlas (or managed) cluster and rotate `JWT_SECRET`.
- Behind a load balancer, consider moving the in-memory random-question sampling logic as-is — it already lives in MongoDB aggregation (`$sample`), so it scales with your database, not your app server.
