# Docker Local Development Setup

Run BlackSwans.ai API, Worker, and Frontend as Docker containers on your Mac, connecting to your local PostgreSQL.

## Prerequisites

1. **Docker Desktop for Mac** - [Download](https://www.docker.com/products/docker-desktop/)
2. **PostgreSQL** - Postgres.app running with `blackswans_dev` database
3. **Secrets** - `.env.docker` file with API keys (created from `.envrc`)
4. **Frontend Repo** - `blackswans-frontend` cloned alongside this repo

## Quick Start

```bash
# 1. Ensure .env.docker exists with secrets
# (Already created from .envrc - just verify it exists)
ls -la .env.docker

# 2. Create data directory for file storage
mkdir -p data/docker_files

# 3. Build base image (ONCE - includes Python deps + ML models ~2GB)
docker compose build base

# 4. Build app images (FAST - just copies code)
docker compose build api worker

# 5. Build frontend image (requires ../blackswans-frontend)
docker compose build frontend

# 6. Start services in background
docker compose up -d

# 7. View logs
docker compose logs -f

# 8. Test the API
curl http://localhost:8000/api/v1/health
```

## After Code Changes

Only rebuild the app images (fast, base image is cached):

```bash
docker compose build api worker
docker compose up -d
```

## Architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              Docker Desktop                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │ blackswans-api   │  │ blackswans-worker│  │  blackswans-frontend     │  │
│  │ (FastAPI)        │  │ (Temporal Worker)│  │  (Next.js)               │  │
│  │ Port: 8000       │  │ Background       │  │  Port: 3000              │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────────────────────────┘  │
│           │                     │                                          │
│           └─────────┬───────────┘                                          │
│                     │                                                      │
│  ┌──────────────────▼─────────────────────────────────────────────────┐   │
│  │              Shared Volume: ./data/docker_files                     │   │
│  │              (Mounted at /app/data in API/Worker containers)        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
             │
             │ host.docker.internal
             ▼
┌────────────────────────────────────────────────────────────┐
│                     Your Mac                                │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │  PostgreSQL    │  │ Captured Files │                    │
│  │  (Postgres.app)│  │ ./data/        │                    │
│  │  Port: 5432    │  │ docker_files/  │                    │
│  └────────────────┘  └────────────────┘                    │
└────────────────────────────────────────────────────────────┘
             │
             │ Internet
             ▼
┌────────────────────────────────────────────────────────────┐
│                 External Services                           │
│  Temporal Cloud │ Claude API │ Elasticsearch │ ScrapingBee │
└────────────────────────────────────────────────────────────┘
```

## Commands

### Build Images

```bash
# Build both images
docker compose build

# Build specific image
docker compose build api
docker compose build worker

# Force rebuild (no cache)
docker compose build --no-cache
```

### Start/Stop Services

```bash
# Start in background
docker compose up -d

# Start with logs
docker compose up

# Stop services (keeps volumes)
docker compose down

# Stop and remove volumes
docker compose down -v

# Restart a service
docker compose restart api
docker compose restart worker
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f worker

# Last 100 lines
docker compose logs --tail=100 api
```

### Shell Access

```bash
# API container
docker compose exec api bash

# Worker container
docker compose exec worker bash

# Run a command
docker compose exec api python -c "from config import get_settings; print(get_settings().app.environment)"
```

### Health Check

```bash
# Check container status
docker compose ps

# API health endpoint
curl http://localhost:8000/api/v1/health

# Check worker process
docker compose exec worker pgrep -f run_worker
```

## File Storage

Captured content is stored in `./data/docker_files/` on your Mac:

```bash
# View captured files
ls -la data/docker_files/

# Files are organized by UUID
data/docker_files/
├── 2dca767d-6067-4ccf-b04d-b2f821f0172d/
│   └── content.html
└── f2fac1d4-b834-4fd6-a0b3-d5ca8b498d64/
    └── document.pdf
```

## Browser Extension Testing

1. Start Docker services:
   ```bash
   docker compose up -d
   ```

2. Verify API is running:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

3. Configure browser extension to use `http://localhost:8000`

4. Capture content - files appear in `./data/docker_files/`

5. Check database for ingested content:
   ```bash
   psql blackswans_dev -c "SELECT id, title, status FROM content_items ORDER BY created_at DESC LIMIT 5;"
   ```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs api
docker compose logs worker

# Verify PostgreSQL is running
psql blackswans_dev -c "SELECT 1;"

# Check Docker network
docker network ls
```

### Can't connect to PostgreSQL

The containers use `host.docker.internal` to reach your Mac's PostgreSQL:

```bash
# Verify from inside container
docker compose exec api python -c "
from config import get_settings
print(get_settings().database.url)
"

# Should show: postgresql+asyncpg://pv@host.docker.internal:5432/blackswans_dev
```

### Worker not processing workflows

```bash
# Check worker logs
docker compose logs -f worker

# Verify Temporal connection
docker compose exec worker python -c "
import asyncio
from temporalio.client import Client
from config import get_settings

async def check():
    s = get_settings()
    client = await Client.connect(
        s.temporal.address,
        namespace=s.temporal.namespace,
        api_key=s.secrets.temporal_api_key.get_secret_value() if s.secrets.temporal_api_key else None,
        tls=s.temporal.use_tls,
    )
    print('Connected to Temporal:', client.identity)

asyncio.run(check())
"
```

### Rebuild after code changes

```bash
# Rebuild and restart
docker compose build && docker compose up -d

# Or just restart (uses cached image)
docker compose restart
```

## Configuration

The Docker environment uses `config/docker.toml`:

- **Database**: `host.docker.internal:5432` (Mac's PostgreSQL)
- **File Storage**: `/app/data` → `./data/docker_files/`
- **Temporal**: Temporal Cloud (eu-west-1)
- **Elasticsearch**: Elastic Cloud
- **All adapters**: Real implementations (same as E2E tests)

## Secrets

Secrets are loaded from `.env.docker` (gitignored):

| Variable | Source | Description |
|----------|--------|-------------|
| `TEMPORAL_API_KEY` | Temporal Cloud Console | Workflow orchestration |
| `PYDANTIC_AI_API_KEY` | Anthropic Console | Claude API for BibTeX extraction |
| `HUGGINGFACE_API_KEY` | HuggingFace | Embeddings (optional, uses local) |
| `SCRAPING_BEE_API_KEY` | ScrapingBee Dashboard | Web scraping |
| `ELASTICSEARCH_API_KEY` | Elastic Cloud Console | Search and indexing |
| `ABLY_API_KEY` | Ably Dashboard | Real-time events |
| `POSTGRES_PASSWORD` | Empty for Postgres.app | Database authentication |
| `CLERK_PUBLISHABLE_KEY` | Clerk Dashboard | Frontend authentication (public) |
| `CLERK_SECRET_KEY` | Clerk Dashboard | Frontend authentication (secret) |
| `NOVU_APPLICATION_IDENTIFIER` | Novu Dashboard | Notifications (optional) |
