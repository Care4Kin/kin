# Kin

## Project Introduction

**What is this project?**

Kin is a web application that helps families coordinate care for an aging or dependent loved one. An elder invites the people helping them into a private **family circle**, where shared bills, subscriptions, financial accounts, prescriptions, appointments, and notes live in one place instead of being scattered across group texts and spreadsheets. Each caregiver sees only what the elder has chosen to share with them, and everyone stays in the loop through email digests, SMS, and an AI assistant that can answer questions about the circle's own data.

**Why was it built?**

Caregiving for an elderly or dependent family member is usually coordinated informally — a group text for bills, a different one for medications, a phone call when something feels off. That makes it easy for a bill to go unpaid, a refill to be missed, or a suspicious call to go unmentioned until it's too late. Kin gives a family circle a single source of truth, with just enough automation (AI-drafted digests, an in-app assistant, scam-risk assessment) to lighten the mental load without taking the human out of the loop.

**Who is it for?**

- **Elders** who want to control what their care circle can see — their bills, prescriptions, and accounts — and keep a fallback way to sign back in if they forget a password.
- **Caregivers** (family members or friends) who share responsibility for an elder's wellbeing and need a shared, permissioned view of what needs attention.

### What makes Kin different

- **Granular, per-caregiver visibility.** An elder (or whoever invites a caregiver) decides — category by category — whether that caregiver can see bills, prescriptions, accounts, flags, subscriptions, or appointments. Subscriptions, appointments, and notes are always shared with the whole circle; the rest is opt-in per person.
- **AI that only knows what it's told.** *Ask Kin*, the in-app assistant, is a tool-calling chatbot (Groq / Llama 3.3) that can only query the exact circle data the asking user is permitted to see — it never guesses at numbers or dates, and if it's asked about something outside its tools (like reporting a scam), it hands back real hotline numbers instead of inventing one.
- **AI-drafted, permission-scoped digest emails.** Each caregiver picks their own cadence (daily/weekly/biweekly/monthly/off) in Settings; a scheduled job drafts a short, warm summary from just the sections that caregiver can see — overdue bills and refills first, routine stuff last.
- **Built-in fraud awareness.** Flags raised on a suspicious call, text, email, or bill get an AI risk assessment (low/medium/high, plain-language explanation, suggested next step) rather than just sitting in a list, and Plaid-linked transactions that look unusually large surface the same kind of assessment automatically.
- **Security designed for the way elders actually get phished.** A security-question fallback exists for when a password is forgotten, but it only works from a device that has already logged in successfully some other way (password, SMS code, or Google) — a correct answer alone can't be used to sign in from an unfamiliar device. Failed attempts lock out after 5 tries, and a Settings toggle lets a user directly manage whether the current device is trusted.

## Deployment & Demo

**Live Deployment:** [https://kin-frontend.onrender.com/](https://kin-frontend.onrender.com/)

## Additional Project Links

- Wireframes: [Excalidraw board](https://excalidraw.com/#room=1b482c8bf933a6cef9cd,wuvVUUk22_2Hcs7fJTpQfQ)
- Project Proposal: [Google Doc](https://docs.google.com/document/d/1dGEgJf7xnHXUElOZpvTWB_dx-Dhi66rYN8wfloh5hK0/edit?tab=t.0#heading=h.canbmh92j15o)

## Core Features

- **Family circles** — an elder creates a circle and invites caregivers by email, choosing what each invitee can see before they even accept.
- **Bills, subscriptions & accounts** — shared tracking of what's owed, what's recurring, and where important financial/healthcare/government accounts live.
- **Prescriptions & pill logs** — active medications with refill dates, plus a daily taken/not-taken log per prescription.
- **Appointments & notes** — shared scheduling and free-form notes visible to the whole circle.
- **Flags** — report a suspicious call, text, email, or bill; each one gets an AI risk read and can be marked resolved with a note.
- **Ask Kin** — a permission-aware AI chatbot for quick questions about the circle's own bills, subscriptions, appointments, prescriptions, and accounts, with real fraud-hotline numbers on hand for anything it can't (and shouldn't) answer itself.
- **AI digest emails** — caregiver-configurable cadence, generated fresh each send from only the data that caregiver is allowed to see.
- **Bank linking (Plaid)** — connect a bank account and get suggested bills/subscriptions detected from transactions, which can be accepted into the circle or dismissed for good.
- **Multi-channel sign-in** — email/password, SMS verification codes (Twilio), Google Sign-In, and a device-trust-gated security question as a last resort.
- **Feedback, FAQ & caregiver/scam-safety resources** — in-app pages for submitting feedback and learning how to spot common scams.
- **Accessibility & theming** — a dedicated accessibility context and selectable color themes.

## Tech Stack

**Frontend:**
- React 18 (Vite)
- React Router 7
- react-plaid-link
- lucide-react

**Backend:**
- Python / FastAPI / Uvicorn

**Database:**
- PostgreSQL
- SQLAlchemy 2.0 (ORM)
- Alembic (migrations)

**Additional Libraries & APIs:**
- PyJWT & bcrypt — authentication and password hashing
- Twilio — SMS verification codes
- Resend — transactional email (invitations, digests)
- Groq (Llama 3.3 70B) — Ask Kin chatbot, digest drafting, fraud-risk assessment
- Plaid — bank account linking and transaction-based bill/subscription suggestions
- Google Identity Services (`google-auth`) — Google Sign-In
- Pydantic / pydantic-settings — request validation & config management

**Development Tools:**
- Git & GitHub
- npm
- pip / venv
- Render (hosting) + GitHub Actions (scheduled digest trigger)

## Project Structure (MVC)

Kin follows an MVC-style separation on the backend, paired with a React frontend as the view layer:

```
backend/app/
├── models/       # Model — SQLAlchemy ORM classes (User, FamilyCircle, CircleMember,
│                 #   CircleInvitation, Bill, Subscription, Account, Prescription,
│                 #   PillLog, Appointment, Flag, Note, TrustedDevice, PlaidItem,
│                 #   PlaidDismissedSuggestion, FeedbackMessage)
├── schemas/      # Pydantic request/response contracts, one per resource
├── routers/      # Controller — FastAPI route handlers (auth, circles, bills,
│                 #   subscriptions, accounts, prescriptions, appointments, flags,
│                 #   notes, plaid, ask_kin, feedback, internal)
├── services/     # Business logic (Groq client, digest generation, email, SMS,
│                 #   Plaid client & suggestion matching, invitation claiming)
├── middleware/   # Auth middleware (JWT verification, circle-access checks)
├── database.py   # DB engine/session setup
├── config.py     # Environment-driven settings
└── main.py       # App entrypoint & router registration

frontend/src/
├── pages/        # View — one folder per feature (dashboard, bills, subscriptions,
│                 #   accounts, prescriptions, appointments, flags, notes, circle,
│                 #   ask-kin, feedback, faq, how-it-works, scam-library,
│                 #   caregiver-resources, device-guide, settings, auth, landing)
├── components/   # Reusable/layout components (Sidebar, TopBar, BottomNav,
│                 #   detected-item cards, onboarding slides)
├── context/      # AuthContext, ThemeContext, AccessibilityContext
├── services/     # API client
├── hooks/        # Shared React hooks (fetch, resource lists, Plaid link)
└── utils/        # Date formatting, device ID generation
```

## Project Setup Instructions

### Prerequisites

- Node.js v18+
- Python 3.11+
- PostgreSQL (running locally or accessible remotely)
- Optional but needed for full functionality: Twilio, Resend, Google OAuth client, Plaid, and Groq API credentials

### Installation Steps

1. **Clone the repository:**

   ```bash
   git clone git@github.com:Care4Kin/kin.git
   cd kin
   ```

2. **Install dependencies:**

   ```bash
   # Backend (Python)
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

   # Frontend (Node.js)
   cd ../frontend
   npm install
   ```

3. **Environment Setup:**

   ```bash
   # From the backend directory
   cp .env.example .env
   # Fill in DATABASE_URL and SECRET_KEY at minimum; add Twilio, Resend,
   # Google, Plaid, and Groq credentials to unlock those features

   # From the frontend directory
   cp .env.example .env
   # Set VITE_API_URL and VITE_GOOGLE_CLIENT_ID
   ```

   | Backend variable | Purpose |
   |---|---|
   | `DATABASE_URL` | PostgreSQL connection string |
   | `SECRET_KEY` | JWT signing secret |
   | `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_PHONE_NUMBER` | SMS verification codes |
   | `RESEND_API_KEY` | Invitation and digest emails |
   | `FRONTEND_URL` | CORS + email links |
   | `GOOGLE_CLIENT_ID` | Google Sign-In token verification |
   | `PLAID_CLIENT_ID` / `PLAID_SECRET` / `PLAID_ENV` | Bank account linking |
   | `GROQ_API_KEY` | Ask Kin, AI digests, fraud-risk assessment |
   | `INTERNAL_TASK_SECRET` | Authenticates the scheduled digest-send trigger |

4. **Database Setup:**

   ```bash
   # From the backend directory, with venv activated
   alembic upgrade head
   ```

5. **Start the application:**

   ```bash
   # Backend (from backend/, with venv activated)
   uvicorn app.main:app --reload

   # Frontend (from frontend/, in a separate terminal)
   npm run dev
   ```

6. **Access the application:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - Health check: `http://localhost:8000/health`

### Deployment

Kin deploys to Render as two services, defined in `render.yaml`:
- `kin-backend` — FastAPI app; each deploy runs `alembic upgrade head` before starting Uvicorn.
- `kin-frontend` — the Vite build, served as a static site with an SPA rewrite rule.

A GitHub Actions workflow (`.github/workflows/caregiver-digest.yml`) calls the backend's internal digest endpoint on a daily cron; each caregiver's own `digest_frequency` preference decides whether they actually get an email that day.

> Uploaded/generated content aside, note that Plaid and Groq features are inert (return 503/disabled responses) unless their respective API keys are configured — the app still runs fine without them.

## Contributing (Optional)

We welcome contributions to this project! Please follow these guidelines:

### How to Contribute

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes following our coding standards
4. Write or update tests as needed
5. Commit your changes with descriptive commit messages
6. Push to your branch: `git push origin feature/your-feature-name`
7. Submit a pull request with a clear description of your changes

### Contribution Guidelines

- Follow the existing code style and conventions
- Write clear, descriptive commit messages
- Include tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting PR

## Development Workflow

This project follows a branch and merge workflow:

- Never push code directly to the main branch
- Work on separate feature branches
- Create pull requests (PRs) for all changes
- All PRs must be reviewed and merged by someone else, even on solo projects
- Delete branches after successful merges

### Branch Naming Convention

- `feature/feature-name` for new features
- `fix/bug-description` for bug fixes
- `update/component-name` for updates
- `style/styling-changes` for styling updates

## Documentation Standards

### Inline Comments

- Document your code with clear, concise comments
- Label different parts of the code
- Describe what functions and files are for
- Delete any commented-out code before committing

### Commit Message Format

Use descriptive commit messages that start with:

- `feat:` for new features
- `fix:` for bug fixes
- `update:` for updates to existing functionality
- `style:` for styling changes
- `delete:` for removing code/files

Examples:

```
feat: add user authentication system
fix: resolve login validation bug
update: improve error handling in API calls
style: update navigation bar styling
delete: remove deprecated helper functions
```

## Project Management

### Scrum Board

- Maintain an updated and detailed scrum board
- Use specific, descriptive cards for all tasks
- Track progress through different stages (To Do, In Progress, Review, Done)

### Pull Request Guidelines

All PRs should include:

- Descriptive titles that summarize the changes
- Detailed descriptions including:
  - Features added or modified
  - Bug fixes implemented
  - Successful testing results
  - Any breaking changes
  - Screenshots (if UI changes)

**PR Description Template:**

```markdown
## What this PR does
[Brief description of changes]

## Features Added/Modified
- [List of new features or modifications]

## Testing
- [X] All tests pass
- [X] Manually tested functionality
- [X] No breaking changes
