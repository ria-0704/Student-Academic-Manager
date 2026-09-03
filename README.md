# Student Academic Manager — Thapar University

A full-stack web application for Thapar University students to manage study material, track progress, practice mock exams with AI evaluation, and plan their study schedule.

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React |
| Backend   | Node.js, Express.js                            |
| Database  | MySQL (mysql2)                                 |
| Auth      | JWT + bcryptjs                                 |
| AI        | Google Gemini API (`gemini-1.5-flash`)         |
| Files     | Multer (local disk storage)                    |
| Text      | pdf-parse + officeparser                       |

---

## Features

- **Authentication** — Register/login with `@thapar.edu` email only
- **Subject Management** — Add, edit, delete subjects with codes
- **Syllabus & Units** — Organize subjects into units
- **Study Material** — Upload PDF/PPT/PPTX, organize by subject & unit
- **Study Status** — Track Not Started / In Progress / Completed per material
- **AI Summarization** — Quick Revision, Detailed, Exam-Oriented, Simple summaries
- **Mock Practice** — Generate university-style theoretical questions with Gemini
- **AI Evaluation** — Submit written answers, get examiner-style scoring with feedback
- **Evaluation Result** — Score breakdown, strengths, missing points, model answer
- **Attempt History** — View all past attempts with full evaluation
- **Datesheet** — Add exams with countdown timer
- **Study Planner** — Manual tasks + AI-generated study plan
- **Performance** — Charts showing score trends, subject comparison, difficulty breakdown
- **Profile** — Update display name

---

## Project Structure

```
student-academic-manager/
├── client/                    # React + Vite frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # AuthContext, ToastContext
│   │   ├── pages/             # All page components
│   │   ├── services/          # Axios API instance
│   │   └── utils/             # Helper functions
│   └── package.json
│
└── server/                    # Node.js + Express backend
    ├── controllers/           # Route handlers
    ├── routes/                # Express routers
    ├── middleware/             # Auth, upload middleware
    ├── services/              # geminiService.js
    ├── db/                    # connection.js + schema.sql
    ├── utils/                 # textExtractor.js
    ├── uploads/               # Uploaded files (auto-created)
    ├── server.js
    └── package.json
```

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- MySQL 8.0+
- A Google Gemini API key ([get one free at Google AI Studio](https://aistudio.google.com/))

---

### Step 1: Create the MySQL Database

Open MySQL shell or Workbench and run:

```sql
SOURCE /path/to/student-academic-manager/server/db/schema.sql;
```

Or paste the contents of `server/db/schema.sql` into MySQL Workbench and execute.

---

### Step 2: Configure the Backend

```bash
cd student-academic-manager/server
cp .env.example .env
```

Edit `server/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_academic_manager
JWT_SECRET=any_long_random_secret_string
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
PORT=5000
```

---

### Step 3: Install Backend Dependencies

```bash
cd server
npm install
```

---

### Step 4: Install Frontend Dependencies

```bash
cd ../client
npm install
```

---

### Step 5: Run the Application

**Terminal 1 — Start the backend:**
```bash
cd server
npm run dev
```
The server starts on `http://localhost:5000`

**Terminal 2 — Start the frontend:**
```bash
cd client
npm run dev
```
The app opens at `http://localhost:5173`

---

## First-Time Use

1. Open `http://localhost:5173`
2. Click **Register** and create an account with your `@thapar.edu` email
3. Add a subject (e.g., "Database Management Systems", code "CS301")
4. Add units to the subject
5. Upload a PDF or PPT for a unit
6. Click **Summarize** on a material to generate AI notes
7. Go to **Mock Practice** → select subject → generate a question → write your answer → submit for AI evaluation
8. View your score, feedback, and model answer in the evaluation result

---

## API Reference (Key Endpoints)

| Method | Endpoint                             | Description                    |
|--------|--------------------------------------|--------------------------------|
| POST   | `/api/auth/register`                 | Register with @thapar.edu      |
| POST   | `/api/auth/login`                    | Login                          |
| GET    | `/api/dashboard`                     | Dashboard summary              |
| GET/POST/PUT/DELETE | `/api/subjects`         | Subject CRUD                   |
| GET/POST/PUT/DELETE | `/api/units`            | Unit CRUD                      |
| GET/POST/PUT/DELETE | `/api/materials`        | Material CRUD + upload         |
| GET    | `/api/materials/:id/download`        | Download/view file             |
| GET/POST | `/api/summaries/:materialId`       | Get / generate AI summary      |
| POST   | `/api/mock/generate`                 | Generate mock question         |
| POST   | `/api/mock/submit`                   | Submit answer for evaluation   |
| GET    | `/api/attempts`                      | All attempt history            |
| GET    | `/api/attempts/:id`                  | Single attempt + evaluation    |
| GET/POST/PUT/DELETE | `/api/exams`            | Datesheet CRUD                 |
| GET/POST/PUT/DELETE | `/api/planner`          | Study planner tasks            |
| POST   | `/api/planner/generate`              | AI-generate study tasks        |
| GET    | `/api/performance`                   | Performance analytics          |
| GET/PUT | `/api/profile`                      | View / update profile          |

---

## Notes

- Uploaded files are stored locally under `server/uploads/<userId>/<subjectId>/`
- Files are served through authenticated routes — users cannot access each other's files
- Gemini API is called only from the backend — the API key is never exposed to the client
- Text extraction supports PDF (pdf-parse) and PPT/PPTX (officeparser)
- All SQL queries use parameterized statements to prevent SQL injection
