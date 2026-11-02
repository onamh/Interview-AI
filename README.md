# AI Interview Coach — Campus Placement & Internship Prep Platform

> **Final Year Computer Science Project / 45-Day Internship Capstone**  
> An intelligent full-stack AI platform that prepares students for campus placements and technical interviews with resume analysis, real-time voice speech interaction, database-backed progress tracking, and rubric evaluations.

---

## 🌟 Key Highlights & Features

### 1. 🔐 Robust User Authentication & SQLite Database Persistence
- **Secure Authentication**: Candidate registration and login powered by PBKDF2-HMAC-SHA256 password hashing and standard JWT (JSON Web Tokens).
- **Relational Database**: Persistent SQLite database via SQLAlchemy (`interview_coach.db`) storing candidate profiles, interview sessions, question histories, and detailed performance rubrics.
- **⚡ 1-Click Instant Demo Login**: Built-in 1-click demo button (*Aarav Sharma - Candidate*) allowing instant presentation to evaluators and teachers without manual typing.

### 2. 📊 Dynamic Candidate Dashboard
- **Dual-State Experience**:
  - **New Candidate State**: Welcoming introductory onboarding guide with a 3-step walkthrough and a prominent *"Launch Your First Mock Interview"* call-to-action.
  - **Returning Candidate State**: Live placement readiness badges (*Placement Ready / Good Progress / Practice Required*), overall average score, personal best, total questions solved, and aggregated strengths & weaknesses.
- **History & Past Reports**: Detailed history cards of every mock interview session with one-click access to full evaluation reports and delete capabilities.

### 3. 📄 PDF Resume Intelligence & Tailored Questions
- **Automated Resume Parsing**: Upload any PDF resume. PyMuPDF (`fitz`) and OCR extract academic projects, internships, skills, and tools.
- **Project-Specific Viva**: Generates technical and architecture questions specifically about the candidate's actual projects (e.g. asking them to defend their tech stack choices, database schema, scaling, and concurrency trade-offs).
- **Flexible Flow**: Candidates can also choose to practice without a resume to get standardized role-based placement questions.

### 4. 🎙️ Dual-Mode Voice & Speech Answering (Web Speech API)
- **Speech-to-Text Microphone Dictation**: Candidates can click *"Speak Answer (Voice)"* and speak naturally. Live speech recognition transcribes their words directly into the response box with an active wave animation.
- **Text-to-Speech AI Interviewer Voice**: Candidates can click *"Listen to Question"* (or toggle auto-read) to hear the AI interviewer speak questions aloud using browser speech synthesis.
- **Typing Fallback**: Candidates can seamlessly edit or type their answers at any time.

### 5. 🏆 In-Depth Performance Evaluation & Scoring Rubrics
- **3-Metric Scorecard**: Overall Placement Score, Technical Depth Score, and Communication & Articulation Score (0–100).
- **Strengths & Weaknesses**: Clear checkmarked strengths and highlighted areas to polish before real placement drives.
- **Actionable Placement Tips**: Practical steps covering DSA time complexities, STAR method explanations, and system design whiteboarding.
- **Question-by-Question Deep Dive**: Shows the question asked, candidate's exact answer, AI critique, and a recommended **Ideal / Model Answer**.
- **🖨️ PDF Export**: One-click *"Print / Save PDF Report"* formatted cleanly for student portfolios.

### 6. 🛡️ Fail-Proof Dual-Engine Architecture
- **Online Mode**: Integrates with Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`) for AI generation and evaluation.
- **Instant Fallback Engine**: If Wi-Fi is spotty, offline, or API quota is exceeded, an intelligent local evaluator seamlessly activates within 200ms—ensuring **zero presentation crashes** in front of evaluators!

---

## 🏗️ System Architecture

```
AI Interview Coach
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST endpoints (Auth, Interview, Resume)
│   │   ├── database/        # SQLite connection, engine & SQLAlchemy models
│   │   ├── services/        # Interview orchestration, Gemini & fallback engines
│   │   └── utils/           # Auth (JWT, PBKDF2), PDF extraction, prompts
│   ├── main.py              # Application entrypoint & CORS middleware
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables (GEMINI_API_KEY, GEMINI_MODEL)
│   └── interview_coach.db   # Auto-created SQLite database file
└── frontend/
    ├── src/
    │   ├── api/             # Axios API client with JWT interceptors
    │   ├── components/      # Navbar, AuthModal, LoadingSpinner
    │   ├── context/         # AuthContext (login, register, demoLogin, logout)
    │   ├── pages/           # Home, Dashboard, InterviewSetup, Interview, Evaluation
    │   ├── App.jsx          # Route configuration
    │   └── index.css        # Modern slate/indigo design system
    ├── package.json
    └── vite.config.js
```

---

## 🚀 How to Run the Project in VS Code

### Step 1: Clone / Open in VS Code
Open the project directory in VS Code:
```bash
code "c:\Users\onamh\Desktop\Projects\AI Interview Coach - Copy"
```

---

### Step 2: Start the Backend (Terminal 1)

1. Open a new terminal in VS Code (`Ctrl + ~` or Terminal -> New Terminal).
2. Activate the pre-configured virtual environment:
   ```powershell
   cd backend
   .\venv\Scripts\activate
   ```
3. Start the FastAPI backend server:
   ```powershell
   uvicorn main:app --reload --port 8000
   ```
4. You should see:
   ```
   INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
   INFO:     Application startup complete.
   ```
   *(The SQLite database `interview_coach.db` will initialize automatically).*
   - Interactive Swagger API docs are available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### Step 3: Start the Frontend (Terminal 2)

1. Open a second terminal split in VS Code.
2. Navigate to the frontend directory:
   ```powershell
   cd frontend
   ```
3. Launch the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 🎯 Demo & Presentation Walkthrough (For Teachers & Evaluators)

1. **Homepage (`/`)**:
   - Showcase the landing page with feature cards, placement focus, and modern design.
2. **Instant Sign In**:
   - Click **"⚡ 1-Click Demo"** in the navigation bar to immediately sign in as *Aarav Sharma (Demo Candidate)*.
   - Alternatively, click **"Register"** to create a custom student account.
3. **Candidate Dashboard (`/dashboard`)**:
   - If starting fresh: explain the **New Candidate** onboarding view.
   - If returning: demonstrate the placement metrics, average score badge, aggregated strengths, and past interview history.
4. **Mock Interview Setup (`/setup`)**:
   - Select a Target Role (e.g. *Full Stack Developer*, *Machine Learning Engineer*).
   - Select Tech Stack (e.g. *React*, *Python*, *Java*, *FastAPI*).
   - Select Difficulty and Question Count (choose *3 Questions* for a fast presentation demo!).
   - **Upload a PDF Resume** to showcase project extraction, or leave blank for standard questions.
5. **Interactive Interview Room (`/interview/:sessionId`)**:
   - Click **"🔊 Listen to Question"** to demonstrate AI speech synthesis reading out the interview question.
   - Click **"🎙️ Speak Answer (Voice)"** and speak into your microphone to show real-time speech-to-text dictation.
   - Demonstrate typing and submit answers.
6. **Evaluation & Placement Rubric Report (`/evaluation`)**:
   - Walk the teachers through the **Placement Readiness Verdict**, 3 score gauges, strengths, weaknesses, and actionable suggestions.
   - Expand the **Question-by-Question Analysis** showing the candidate's exact answer alongside the AI critique and **Ideal Model Answer**.
   - Click **"🖨️ Print / Save PDF Report"** to show presentation export capabilities.

---

## ⚙️ Environment Configuration

In `backend/.env`:
```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-2.5-flash
```
*Note: If no internet or API key is present, the built-in intelligent fallback engine automatically handles generation and evaluation without interruption.*

---

## 🎓 Academic Presentation Summary
- **Domain**: Artificial Intelligence in Education & Placement Preparation.
- **Frontend**: React 19, Vite, React Router 7, Web Speech API (SpeechRecognition & SpeechSynthesis).
- **Backend**: Python 3.13, FastAPI, SQLAlchemy ORM, SQLite3, PyMuPDF, Pydantic v2.
- **Security**: PBKDF2-HMAC-SHA256 password salting, HS256 JWT tokens.
- **Developed As**: 45-Days Internship Project by Final Year Computer Science Student.
