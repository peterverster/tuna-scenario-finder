# Development Setup Guide

Complete guide for setting up a BlackSwans.ai development environment.

---

## Overview

BlackSwans.ai is a weak-signal detection platform with the following architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICES                                  │
├─────────────┬─────────────┬─────────────┬─────────────────────────┤
│  Frontend   │   FastAPI   │   Temporal  │   Temporal              │
│  Next.js    │   API       │   Worker    │   Dev Server            │
│  :3000      │   :8000     │             │   :8233                 │
├─────────────┴─────────────┴─────────────┴─────────────────────────┤
│                        DATA STORES                               │
├─────────────────────────────┬─────────────────────────────────────┤
│        PostgreSQL           │        Elasticsearch (optional)     │
│        :5432                │        :9200                        │
└─────────────────────────────┴─────────────────────────────────────┘
```

---

## Quick Start (5 minutes)

If you want to get running quickly:

```bash
# 1. Clone and enter directory
cd blackswans

# 2. Install dependencies
make install-dev

# 3. Copy and edit local config
cp config/local.toml.example config/local.toml

# 4. Create secrets file
cat > .envrc << 'EOF'
export PYDANTIC_AI_API_KEY="your-anthropic-or-openai-key"
export SCRAPINGBEE_API_KEY="your-scrapingbee-key"
export ABLY_API_KEY="your-ably-key"
export SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
export POSTGRES_PASSWORD=""
EOF
direnv allow

# 5. Setup database (Postgres.app users)
./scripts/setup-pgmac-database.sh

# 6. Start all services
make dev
```

**Services running:**
- API Docs: http://localhost:8000/docs
- Temporal UI: http://localhost:8233

---

## Step-by-Step Setup

### 1. Prerequisites

**Required:**
- Python 3.11+
- PostgreSQL 15+ (Postgres.app recommended for macOS)
- uv (Python package manager)
- direnv (secret management)

**Optional:**
- Temporal CLI (for workflow orchestration)
- Node.js 18+ (for frontend development)
- Elasticsearch 8.x (for vector search)

**Install prerequisites (macOS):**
```bash
# Python package manager
brew install uv

# Secret management
brew install direnv
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
source ~/.zshrc

# Temporal CLI
brew install temporal

# PostgreSQL (Postgres.app recommended)
# Download from: https://postgresapp.com/
```

---

### 2. Install Dependencies

```bash
# Install all dependencies including dev tools
make install-dev
```

This installs:
- Core dependencies (FastAPI, SQLAlchemy, Temporal SDK, etc.)
- Dev tools (pytest, black, ruff, mypy)
- Pre-commit hooks

---

### 3. Configure Local Settings

The configuration system uses layered TOML files:

```
config/
├── base.toml           # Defaults (committed)
├── development.toml    # Dev overrides (committed)
├── production.toml     # Prod overrides (committed)
├── local.toml.example  # Template (committed)
└── local.toml          # YOUR settings (git-ignored)
```

**Create your local config:**
```bash
cp config/local.toml.example config/local.toml
```

**Edit `config/local.toml`:**
```toml
# Your machine-specific settings
[database.connection]
name = "blackswans_dev"
user = "your_username"    # Your macOS username for Postgres.app

# For Temporal Cloud (optional)
[temporal]
address = "your-namespace.tmprl.cloud:7233"
namespace = "your-namespace"
use_tls = true
```

See [Configuration Guide](./configuration-guide.md) for all options.

---

### 4. Configure Secrets

Secrets are managed via environment variables (never in TOML files).

**Create `.envrc`:**
```bash
cat > .envrc << 'EOF'
# LLM API Key (Anthropic or OpenAI)
export PYDANTIC_AI_API_KEY="sk-ant-..."

# Web scraping
export SCRAPINGBEE_API_KEY="..."

# Real-time events (optional)
export ABLY_API_KEY="..."

# Temporal Cloud (optional, for cloud deployment)
export TEMPORAL_API_KEY="eyJ..."

# Security
export SECRET_KEY="your-random-secret"
export JWT_SECRET_KEY="another-random-secret"

# Database (empty for Postgres.app peer auth)
export POSTGRES_PASSWORD=""
EOF

# Allow direnv to load secrets
direnv allow
```

**Verify secrets loaded:**
```bash
env | grep -E "(PYDANTIC|SCRAPINGBEE|ABLY)"
```

---

### 5. Setup Database

**Option A: Postgres.app (Recommended for macOS)**
```bash
./scripts/setup-pgmac-database.sh
```

**Option B: Standard PostgreSQL**
```bash
./scripts/setup-local-database.sh
```

**Option C: Docker**
```bash
docker run -d \
  --name blackswans-postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=blackswans_dev \
  postgres:15
```

**Run migrations:**
```bash
alembic upgrade head
```

---

### 6. Start Services

**Backend only (API + Worker + Temporal):**
```bash
make dev
```

**Full stack (Backend + Frontend):**
```bash
make dev-full
```

**Individual services:**
```bash
make start-temporal   # Temporal dev server only
make run-api          # FastAPI only (with hot-reload)
make run-worker       # Temporal worker only
```

---

## Running Workflows

### Trigger Content Ingestion

```bash
python scripts/trigger_workflow.py https://example.com/article
```

This:
1. Connects to Temporal (local or cloud)
2. Starts `ContentIngestionWorkflow`
3. Scrapes the URL
4. Extracts content and metadata
5. Persists to database

**Monitor in Temporal UI:** http://localhost:8233

---

## Development Commands

### Testing

```bash
make test              # Unit tests only
make test-integration  # Integration tests (requires DB)
make test-all          # All tests
make test-fast         # Fast, no coverage
```

### Code Quality

```bash
make quality           # All checks (format, lint, typecheck, security)
make format            # Auto-format code
make lint              # Ruff linter
make typecheck         # Mypy type checking
```

### Metrics

```bash
make metrics           # Code complexity metrics
make wily-report       # Complexity tracking report
```

---

## Project Structure

```
blackswans/
├── src/
│   ├── domain/              # Pure business logic (no infra deps)
│   │   ├── entities/        # Document, Chunk, Signal, etc.
│   │   ├── value_objects/   # NoveltyScore, PossibilityDistribution
│   │   └── services/        # ChunkingService, PossibilityEngine
│   ├── application/         # Use cases + Port interfaces
│   │   ├── workflows/       # Temporal workflow definitions
│   │   └── ports/           # Abstract interfaces
│   ├── infrastructure/      # Adapters (concrete implementations)
│   │   ├── adapters/        # ScrapingBee, Postgres, Ably, etc.
│   │   ├── configurators/   # Dependency injection
│   │   ├── http/            # FastAPI routes
│   │   └── temporal/        # Worker configuration
│   └── config/              # Settings loader
├── config/                  # TOML configuration files
├── scripts/                 # Development & operational scripts
├── tests/                   # Test suite
├── _docs/                   # Documentation
└── _domain/                 # Domain model documentation
```

---

## Common Tasks

### Connect to Database

```bash
./scripts/connect-db.sh
```

### View Logs

```bash
tail -f /tmp/api.log
tail -f /tmp/worker.log
tail -f /tmp/temporal.log
```

### Stop All Services

```bash
make stop-all
```

### Clear Ports

```bash
make kill-ports    # Kills 3000, 8000, 8233
```

### Reset Database

```bash
./scripts/setup-local-database.sh  # Will prompt to drop existing
```

---

## Troubleshooting

### "direnv not loading"

```bash
direnv status      # Check status
direnv allow       # Re-allow after edits
cd . && cd -       # Force reload
```

### "Module not found"

```bash
# Ensure PYTHONPATH is set
export PYTHONPATH=src
# Or use uv run
uv run python scripts/trigger_workflow.py <url>
```

### "Database connection failed"

```bash
# Check PostgreSQL is running
pg_isready

# For Postgres.app, ensure CLI tools are in PATH
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
```

### "Temporal connection refused"

```bash
# Start Temporal dev server
make start-temporal

# Check it's running
curl http://localhost:8233/api/v1/cluster-info
```

### "API key not found"

```bash
# Check secrets are loaded
env | grep PYDANTIC_AI

# If missing, reload direnv
direnv allow
```

---

## Related Documentation

- [Configuration Guide](./configuration-guide.md) - TOML config and secrets
- [Scripts README](../scripts/README.md) - Script reference
- [Database Quickstart](./database-quickstart.md) - Fast DB setup
- [Testing Strategy](./testing-strategy.md) - Test conventions
- [Domain Model](../_domain/domain-model.md) - DDD documentation
