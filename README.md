# School Admin Panel

Monorepo scaffold with a FastAPI backend and a Next.js frontend. Supabase is planned for auth and storage.

## Structure
- `backend/` FastAPI API service
- `frontend/` Next.js web app

## Backend setup (FastAPI)
1. Create a virtual environment and activate it.
2. Install dependencies:
   - `pip install -r backend/requirements.txt`
3. Create `backend/.env` from `backend/.env.example` and fill in Supabase values.
4. Run the API:
   - `uvicorn app.main:app --reload --app-dir backend`

## Frontend setup (Next.js)
1. Install dependencies:
   - `npm install --prefix frontend`
2. Create `frontend/.env.local` from `frontend/.env.example` and fill in Supabase values.
3. Run the web app:
   - `npm run dev --prefix frontend`

## Notes
- No business logic is implemented yet. This is a baseline scaffold.
- Supabase integration placeholders are in the env templates.

## Contributing
- Follow branching rules in .github/branching-conventions.md.
- Use the PR template in .github/pull_request_template.md.
- Follow design and language rules in .github/agent-instructions.md.
- See CONTRIBUTING.md for workflow details.
- See SECURITY.md for vulnerability reporting.
- See CHANGELOG.md for release history.
