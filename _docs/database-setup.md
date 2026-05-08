# Database Setup Guide

This guide covers setting up PostgreSQL databases for BlackSwans.ai across different environments.

---

## Local Development Setup

### Prerequisites

**PostgreSQL 15+** installed and running locally:

**macOS (Homebrew)**:
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt-get update
sudo apt-get install postgresql-15 postgresql-contrib-15
sudo systemctl start postgresql
```

**Docker** (easiest for development):
```bash
docker run -d \
  --name blackswans-postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=blackswans_dev \
  -v blackswans-db-data:/var/lib/postgresql/data \
  postgres:15
```

### Automated Setup (Recommended)

Run the setup script:

```bash
./scripts/setup-local-database.sh
```

This script will:
1. ✅ Check PostgreSQL connection
2. ✅ Create `blackswans_dev` database
3. ✅ Enable required extensions (uuid-ossp, pg_trgm, btree_gin)
4. ✅ Run Alembic migrations
5. ✅ Verify setup

### Manual Setup

If you prefer manual setup:

```bash
# 1. Create database
createdb -U postgres blackswans_dev

# 2. Enable extensions
psql -U postgres -d blackswans_dev << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
EOF

# 3. Run migrations
source .venv/bin/activate
alembic upgrade head
```

### Verify Setup

```bash
# Check database exists
psql -U postgres -l | grep blackswans_dev

# Check tables
psql -U postgres -d blackswans_dev -c "\dt"

# Test connection with Python
python -c "
from config import get_settings
print(f'DATABASE_URL: {get_settings().database_url}')
"
```

---

## Environment-Specific Configuration

### Development (.env)

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/blackswans_dev
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10
DATABASE_ECHO=false  # Set to true for SQL debugging
```

### Testing (.env.test)

Create a separate test database:

```bash
# Create test database
createdb -U postgres blackswans_test

# Configure .env.test
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/blackswans_test
DATABASE_POOL_SIZE=2
DATABASE_MAX_OVERFLOW=5
DATABASE_ECHO=false
```

### Production (Azure PostgreSQL)

The production database is managed by Terraform ([terraform/postgres.tf](../terraform/postgres.tf)):

- **Service**: Azure PostgreSQL Flexible Server
- **Version**: PostgreSQL 15
- **Storage**: 32GB (configurable)
- **SKU**: B_Standard_B1ms (dev), GP_Standard_D2s_v3 (prod)
- **Backup**: 7 days (dev), 35 days (prod)
- **Authentication**: Managed by Terraform (random_password resource)

Connection string format:
```bash
DATABASE_URL=postgresql+asyncpg://{admin_user}:{password}@{server_name}.postgres.database.azure.com:5432/blackswans_{env}?sslmode=require
```

---

## Database Schema

### Core Tables

The schema is managed by Alembic migrations ([alembic/versions/](../alembic/versions/)):

**Content Ingestion Context**:
- `documents` - Source documents (web, PDF, etc.)
- `chunks` - Text segments with location metadata

**Signal Intelligence Context**:
- `signals` - Detected weak signals/patterns
- `signal_scores` - Time-series π/N scores

**Expert Knowledge Context**:
- `drivers` - Strategic dimensions being monitored
- `experts` - Domain experts with weights
- `fuzzy_rules` - Possibility theory rules

**Foresight Analysis Context**:
- `clips` - User annotations linking text to drivers
- `scenarios` - Future scenarios built from signals

See [_domain/database-schema.md](../_domain/database-schema-pattern.md) for complete schema documentation.

### Extensions Required

- **uuid-ossp**: UUID generation
- **pg_trgm**: Full-text search trigrams
- **btree_gin**: GIN indexes for JSON
- **vector** (optional): pgvector for embeddings (if not using Elasticsearch)

---

## Migrations

### Create Migration

After modifying SQLAlchemy models:

```bash
# Generate migration automatically
alembic revision --autogenerate -m "description of changes"

# Review generated migration in alembic/versions/
# Edit if necessary to fix any auto-detection issues

# Apply migration
alembic upgrade head
```

### Apply Migrations

```bash
# Upgrade to latest
alembic upgrade head

# Upgrade to specific revision
alembic upgrade abc123

# Downgrade one revision
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

### Rollback

```bash
# Rollback to previous version
alembic downgrade -1

# Rollback to specific version
alembic downgrade abc123

# Show SQL without executing (dry run)
alembic upgrade head --sql
```

---

## Troubleshooting

### "PostgreSQL is not running"

**Check status**:
```bash
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql

# Docker
docker ps | grep postgres
```

**Start service**:
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql

# Docker
docker start blackswans-postgres
```

### "Connection refused"

Check `pg_hba.conf` allows local connections:

```bash
# Find config file
psql -U postgres -c "SHOW hba_file"

# Should contain:
# local   all             all                                     trust
# host    all             all             127.0.0.1/32            md5
```

Restart PostgreSQL after changes.

### "Password authentication failed"

Reset password:

```bash
# macOS/Linux
psql -U postgres
ALTER USER postgres PASSWORD 'postgres';
\q

# Docker (recreate container with password)
docker rm -f blackswans-postgres
docker run -d --name blackswans-postgres -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres postgres:15
```

### "Database does not exist"

Create it:

```bash
createdb -U postgres blackswans_dev

# Or use the setup script
./scripts/setup-local-database.sh
```

### "Extension does not exist"

Install PostgreSQL contrib:

```bash
# macOS
brew install postgresql@15

# Ubuntu/Debian
sudo apt-get install postgresql-contrib-15
```

Then enable in database:

```bash
psql -U postgres -d blackswans_dev -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
```

### "asyncpg driver not found"

The application requires `asyncpg` driver (not `psycopg2`):

```bash
# Install asyncpg
pip install asyncpg

# Verify DATABASE_URL uses asyncpg
# Correct:   postgresql+asyncpg://...
# Incorrect: postgresql://... or postgresql+psycopg2://...
```

### Migration conflicts

```bash
# Check current state
alembic current
alembic history

# Stamp database to specific revision (if migrations were manually applied)
alembic stamp head

# Resolve conflicts by merging branches
alembic merge -m "merge branches" head1 head2
```

---

## Performance Tuning

### Connection Pool

Adjust for your workload in [src/config.py](../src/config.py):

```python
# Low traffic (development)
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10

# Medium traffic (staging)
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# High traffic (production)
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=50
```

### Indexes

Key indexes for performance (managed by migrations):

```sql
-- Chunks by document
CREATE INDEX idx_chunks_document ON chunks(document_id);

-- Signals by driver and phase
CREATE INDEX idx_signals_driver_phase ON signals(driver_id, phase);

-- Signal scores time-series
CREATE INDEX idx_signal_scores_signal_time ON signal_scores(signal_id, scored_at DESC);

-- Clips by chunk and driver
CREATE INDEX idx_clips_chunk ON clips(chunk_id);
CREATE INDEX idx_clips_driver ON clips(driver_id);
```

### Query Monitoring

Enable slow query logging:

```sql
-- Show slow queries (>100ms)
ALTER DATABASE blackswans_dev SET log_min_duration_statement = 100;

-- View slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

---

## Backup & Restore

### Local Backup

```bash
# Dump database
pg_dump -U postgres blackswans_dev > backup.sql

# Restore database
psql -U postgres blackswans_dev < backup.sql

# Dump with custom format (faster, compressed)
pg_dump -U postgres -Fc blackswans_dev > backup.dump
pg_restore -U postgres -d blackswans_dev backup.dump
```

### Azure Production Backup

Automated by Azure PostgreSQL Flexible Server:
- **Development**: 7-day retention
- **Production**: 35-day retention, geo-redundant

Manual backup:

```bash
# Get connection details from Azure
az postgres flexible-server show \
  --resource-group rg-blackswans-prod \
  --name psql-blackswans-prod

# Backup
pg_dump -h psql-blackswans-prod.postgres.database.azure.com \
  -U adminuser -d blackswans_prod > backup-prod.sql
```

---

## Security Best Practices

### Local Development

✅ **DO**:
- Use default `postgres` user for local dev
- Use simple passwords (`postgres`) for local dev
- Keep local database on `localhost` only

❌ **DON'T**:
- Expose local PostgreSQL to network (bind to 0.0.0.0)
- Use production credentials locally
- Commit `.env` with real credentials

### Production

✅ **DO**:
- Use Terraform-managed credentials
- Store passwords in Azure Key Vault / GitHub Secrets
- Enable SSL/TLS (`sslmode=require`)
- Use firewall rules to restrict access
- Rotate passwords periodically

❌ **DON'T**:
- Hardcode credentials in code
- Use weak passwords
- Allow public access without firewall rules
- Log full DATABASE_URL (contains password)

---

## Resources

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/15/
- **Azure PostgreSQL**: https://learn.microsoft.com/en-us/azure/postgresql/
- **Alembic Documentation**: https://alembic.sqlalchemy.org/
- **SQLAlchemy Async**: https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- **asyncpg**: https://magicstack.github.io/asyncpg/

---

## Quick Reference

### Common Commands

```bash
# Setup local database
./scripts/setup-local-database.sh

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Check migration status
alembic current
alembic history

# Connect to database
psql -U postgres blackswans_dev

# List tables
psql -U postgres blackswans_dev -c "\dt"

# Backup database
pg_dump -U postgres blackswans_dev > backup.sql

# Drop and recreate
dropdb -U postgres blackswans_dev
createdb -U postgres blackswans_dev
alembic upgrade head
```

### Environment Variables

```bash
# Required (in .env)
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
DATABASE_POOL_SIZE=5
DATABASE_MAX_OVERFLOW=10
DATABASE_ECHO=false  # true for SQL debugging

# Optional
DATABASE_TIMEOUT=30
DATABASE_POOL_RECYCLE=3600
```
