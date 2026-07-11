# Kin

## Project Introduction

**What is this project?**
Kin is a web application that helps families coordinate care for an aging or dependent loved one. An elder's **family circle** — the group of caregivers supporting them — can track shared bills, subscriptions, financial accounts, prescriptions, notes, and flagged concerns in one place, with SMS notifications powered by Twilio to keep everyone in the loop.

**Why was it built?**
Caregiving for an elderly or dependent family member is often coordinated informally across group texts, spreadsheets, and phone calls, which makes it easy for bills to go unpaid, medications to be missed, or important updates to fall through the cracks. Kin centralizes that information so caregivers always have a single source of truth.

**Who is it for?**
- **Elders** who want their care circle to have visibility into their bills, prescriptions, and accounts.
- **Caregivers** (family members or friends) who share responsibility for an elder's wellbeing and need a shared view of what needs attention.

## Deployment & Demo

**Live Deployment:** [https://kin-frontend.onrender.com/](https://kin-frontend.onrender.com/)

## Additional Project Links

- Wireframes: [\[Link to wireframe designs\]](https://excalidraw.com/#room=1b482c8bf933a6cef9cd,wuvVUUk22_2Hcs7fJTpQfQ)
- ERD (Entity Relationship Diagram): [Link to database schema/ERD]
- Project Proposal: https://docs.google.com/document/d/1dGEgJf7xnHXUElOZpvTWB_dx-Dhi66rYN8wfloh5hK0/edit?tab=t.0#heading=h.canbmh92j15o
- Project Blog: [Link to development blog/journal]
- Additional Resources: [Any other relevant links]

## Tech Stack

**Frontend:**
- React 18 (Vite)
- React Router

**Backend:**
- Python / FastAPI

**Database:**
- PostgreSQL
- SQLAlchemy (ORM)
- Alembic (migrations)

**Additional Libraries & APIs:**
- PyJWT & bcrypt — authentication and password hashing
- Twilio — SMS notifications
- Pydantic / pydantic-settings — request validation & config management

**Development Tools:**
- Git & GitHub
- npm
- pip / venv

## Project Structure (MVC)

Kin follows an MVC-style separation on the backend, paired with a React frontend as the view layer:

```
backend/app/
├── models/       # Model — SQLAlchemy ORM classes (User, FamilyCircle, Bill, Subscription,
│                 #   Account, Prescription, Flag, Note, CircleMember)
├── schemas/      # Pydantic request/response contracts, one per resource
├── routers/      # Controller — FastAPI route handlers (auth, circles, bills,
│                 #   subscriptions, accounts, prescriptions, flags, notes)
├── services/     # Business logic (e.g. SMS notifications via Twilio)
├── middleware/   # Auth middleware (JWT verification)
├── database.py   # DB engine/session setup
└── main.py       # App entrypoint & router registration

frontend/src/
├── pages/        # View — one folder per feature (dashboard, bills, prescriptions,
│                 #   subscriptions, accounts, flags, notes, circle, auth, appointments)
├── components/   # Reusable/layout components (Sidebar, TopBar, BottomNav)
├── context/      # AuthContext — global auth state
├── services/     # API client
└── hooks/        # Shared React hooks
```

## Project Setup Instructions

### Prerequisites

- Node.js v18+
- Python 3.11+
- PostgreSQL (running locally or accessible remotely)

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
   # Fill in DATABASE_URL, SECRET_KEY, and Twilio credentials in .env
   ```

4. **Database Setup:**

   ```bash
   # From the backend directory, with venv activated
   alembic upgrade head
   python seed.py   # optional: seed dev/test data
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

## Screenshots (if applicable)
[Add screenshots of UI changes]
```

## License

[Add license information if applicable]

## Contact

[Add your contact information or how people can reach you]
