# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

PNIT (Personal Network Intelligence Tool) is a full-stack application with a serverless backend and Next.js frontend:

- **Backend**: AWS Lambda functions using Serverless Framework
  - Functions: query, uploadConnections, history, deleteHistory, settings
  - Database: PostgreSQL with migrations in `backend/migrations/`
  - AI Integration: OpenAI GPT-4o for network queries
  - Location: `backend/` directory

- **Frontend**: Next.js application with Tailwind CSS
  - Pages: Main app, chat interface, upload, history, settings
  - Components: Header, Footer, PNITLayout, PNITSidebar
  - Location: `frontend/` directory

- **Database Schema**: Located in `backend/schemas/schema.sql`
- **Documentation**: Architecture and PRD in `docs/` directory

## Common Commands

### Frontend Development
```bash
cd frontend
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

### Backend Development
```bash
cd backend
npm run migrate    # Run database migrations
```

### Serverless Deployment
```bash
cd backend
serverless deploy --stage dev    # Deploy to development
serverless offline               # Run locally
```

## Key Configuration Files

- `backend/serverless.yml`: AWS Lambda function definitions and API Gateway routes
- `frontend/tailwind.config.js`: Tailwind CSS configuration
- `backend/utils/db.js`: Database connection utilities
- Migration files in `backend/migrations/` for database schema changes

## Environment Variables

Backend requires:
- `OPENAI_API_KEY`: OpenAI API key for GPT-4o integration
- `DATABASE_URL`: PostgreSQL connection string

## Testing

Both frontend and backend use Jest for testing (configured in package.json devDependencies).