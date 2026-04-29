# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**缘圈子 (Yuan Quan Zi)** - Internal learning forum system for knowledge sharing and learning exchange within the team.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite + Ant Design |
| Backend | Node.js + NestJS + TypeScript |
| Database | PostgreSQL 15 + TypeORM |
| Cache | Redis 7 |
| Search | MeiliSearch |
| Message Queue | BullMQ (Redis-based) |
| File Storage | MinIO / Local Storage |
| Containerization | Docker + Docker Compose |

### Project Structure

```
/
├── api/                      # NestJS backend
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   │   ├── auth/         # Authentication
│   │   │   ├── user/         # User management
│   │   │   ├── post/         # Content/posts
│   │   │   ├── comment/      # Comments
│   │   │   ├── interaction/  # Likes, collections
│   │   │   ├── follow/       # Following system
│   │   │   ├── notification/ # Notifications
│   │   │   ├── search/       # Search functionality
│   │   │   ├── admin/        # Admin panel
│   │   │   └── crawler/      # Content crawling
│   │   ├── common/           # Common components
│   │   ├── config/           # Configuration
│   │   └── database/         # Migrations and seeds
│   └── test/                 # Test files
├── web/                      # React frontend
│   ├── src/
│   │   ├── pages/            # Page components
│   │   ├── components/       # Reusable components
│   │   ├── hooks/            # Custom hooks
│   │   ├── services/         # API services
│   │   └── stores/           # State management
│   └── tests/                # Test files
├── docker-compose.dev.yml    # Development environment
├── docker-compose.prod.yml   # Production environment
└── .env.example              # Environment template
```

## Development Setup

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- pnpm or npm

### Initial Setup

```bash
# 1. Start infrastructure services
docker-compose -f docker-compose.dev.yml up -d postgres redis meilisearch minio

# 2. Setup backend
cd api
npm install
npm run migration:run
npm run seed

# 3. Setup frontend
cd ../web
npm install
```

### Development Commands

**Backend (api/):**

```bash
# Development server with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod

# Database operations
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
npm run seed

# Testing
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report
npm run test:e2e          # E2E tests
```

**Frontend (web/):**

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Testing
npm run test
npm run test:e2e          # Playwright E2E tests
```

**Docker:**

```bash
# Start all development services
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Reset database (WARNING: data loss)
docker-compose -f docker-compose.dev.yml down -v
```

## Architecture

### Module Dependencies

```
auth
  └── user

user
  ├── post
  ├── comment
  ├── like
  ├── follow
  ├── collection
  └── notification

post
  ├── comment
  ├── like
  ├── collection
  └── notification

notification
  └── bullmq (redis)

search
  ├── meilisearch
  └── post

crawler
  ├── post
  └── bullmq
```

### Key Architectural Patterns

1. **Modular NestJS Architecture**
   - Each feature is a self-contained module with its own controller, service, and entity
   - Shared code in `common/` (guards, interceptors, filters)

2. **Database Design**
   - PostgreSQL with TypeORM
   - Soft deletes for content (posts, comments)
   - JSON fields for flexible data (notification data, settings)
   - Comprehensive indexing strategy (see design.md section 3.3)

3. **Authentication Flow**
   - JWT access tokens (15 min expiry) + refresh tokens (7 days)
   - Redis-based session blacklist for logout
   - bcrypt password hashing (salt rounds: 12)
   - Login failure lockout (5 attempts → 15 min lock)

4. **Content State Machine**
   ```
   draft → pending → approved → visible
                ↘ rejected → hidden
   ```

5. **Notification Architecture**
   - BullMQ message queue for async processing
   - WebSocket real-time push
   - Email (SMTP) and IM webhook integrations
   - User-configurable channel preferences

6. **Search Integration**
   - MeiliSearch for full-text search
   - Auto-sync on content CRUD operations
   - Chinese word segmentation support

### Security Model

| Layer | Implementation |
|-------|----------------|
| Network | HTTPS, DDoS protection (Nginx rate limiting) |
| Application | Rate limiting, CORS, input validation |
| Authentication | JWT + bcrypt, session management |
| Data | SQL parameterization, XSS filtering (DOMPurify), data masking |

### Content Weight Algorithm

```typescript
weight = (
  likeCount * 2 +
  commentCount * 3 +
  collectCount * 4 +
  viewCount * 0.1
) / log1p(max(1, postAgeInDays))

if (isEssence) weight *= 1.5
if (isTop) weight *= 2
```

Auto-labeling thresholds (relative to total user count):
- ≥30% likes → Hot
- ≥50% likes → Can be marked as Essence (admin confirmation)
- ≥60% likes → Can be marked as Top (admin confirmation)

## Configuration

### Environment Variables

Key variables in `.env`:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=app
DB_PASSWORD=secret
DB_NAME=yuanquanzi

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# MeiliSearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=master-key

# File Storage (MinIO or local)
STORAGE_TYPE=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=access-key
MINIO_SECRET_KEY=secret-key

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

## Testing Strategy

| Test Type | Framework | Coverage Target |
|-----------|-----------|-----------------|
| Unit | Jest | ≥80% |
| Integration | Jest + supertest | API endpoints |
| E2E | Playwright | Critical user flows |

### Running Tests

```bash
# Backend
cd api
npm run test:cov          # Unit tests with coverage
npm run test:e2e          # E2E tests

# Frontend
cd web
npm run test              # Unit tests
npm run test:e2e          # Playwright tests
```

## Common Development Tasks

### Adding a New API Endpoint

1. Define DTO in `api/src/modules/<module>/dto/`
2. Add method to controller in `api/src/modules/<module>/<module>.controller.ts`
3. Implement business logic in service
4. Add guards if authentication required
5. Write tests

### Database Migration

```bash
cd api

# Generate migration from entity changes
npm run migration:generate -- -n DescriptionOfChange

# Run pending migrations
npm run migration:run

# Rollback last migration
npm run migration:revert
```

### Rebuild Search Index

```bash
cd api
npm run search:reindex
```

## Reference Documents

- **Requirements**: `.claude/specs/yuanquanzi/requirements.md`
- **Design**: `.claude/specs/yuanquanzi/design.md`
- **Tasks**: `.claude/specs/yuanquanzi/tasks.md`
- **Code Guidelines**: `.claude/skills/code-guidelines/SKILL.md`
