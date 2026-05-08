# Database Quick Start

Get your local BlackSwans.ai database up and running in 5 minutes.

---

## 🚀 Quick Setup (3 steps)

### 1. Start PostgreSQL

**Using Docker** (easiest):
```bash
docker run -d \
  --name blackswans-postgres \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=blackswans_dev \
  postgres:15
```

**Using Homebrew** (macOS):
```bash
brew install postgresql@15
brew services start postgresql@15
```

### 2. Create Database

**Automated** (recommended):
```bash
./scripts/setup-local-database.sh
```

**Manual**:
```bash
createdb -U postgres blackswans_dev
psql -U postgres -d blackswans_dev -c 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
alembic upgrade head
```

### 3. Verify

```bash
# Check database exists
psql -U postgres -l | grep blackswans_dev

# Check tables created
psql -U postgres -d blackswans_dev -c "\dt"
```

✅ **Done!** Your database is ready.

---

## 📝 Configuration

Your [.env](.env) file is already configured:

```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/blackswans_dev
```

**Important**:
- ✅ Must use `asyncpg` driver (not `psycopg2`)
- ✅ Default user: `postgres`, password: `postgres`
- ✅ Default database: `blackswans_dev`

---

## 🔄 Common Tasks

### Run Migrations

```bash
alembic upgrade head
```

### Create New Migration

```bash
alembic revision --autogenerate -m "add new table"
```

### Connect to Database

```bash
psql -U postgres blackswans_dev
```

### Reset Database

```bash
dropdb -U postgres blackswans_dev
./scripts/setup-local-database.sh
```

---

## 🆘 Troubleshooting

### PostgreSQL not running

```bash
# Check status
docker ps | grep postgres

# Start Docker container
docker start blackswans-postgres

# Or start Homebrew service
brew services start postgresql@15
```

### Connection refused

Check your [.env](.env) has correct settings:
```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/blackswans_dev
```

### asyncpg not installed

```bash
pip install asyncpg
```

---

## 📚 Full Documentation

For detailed setup, troubleshooting, and production configuration:

👉 **[docs/database-setup.md](docs/database-setup.md)**

---

## 🎯 What Gets Created

The setup script creates:

- ✅ `blackswans_dev` database
- ✅ PostgreSQL extensions (uuid-ossp, pg_trgm, btree_gin)
- ✅ All tables via Alembic migrations:
  - `documents`, `chunks` (Content Ingestion)
  - `signals`, `signal_scores` (Signal Intelligence)
  - `drivers`, `experts`, `fuzzy_rules` (Expert Knowledge)
  - `clips`, `scenarios` (Foresight Analysis)

---

## 🏗️ Architecture

```
Application (FastAPI)
       ↓
SQLAlchemy (async)
       ↓
asyncpg driver
       ↓
PostgreSQL 15+
```

**Key Points**:
- Uses **async SQLAlchemy** with **asyncpg** driver
- Connection pooling configured in [src/config.py](src/config.py)
- Migrations managed by **Alembic**
- Schema defined in [src/infrastructure/database/models.py](src/infrastructure/database/models.py)

---

## 🔐 Security Notes

**Local Development**:
- Default credentials are INSECURE (`postgres`/`postgres`)
- This is ACCEPTABLE for local development only
- Database should only be accessible on `localhost`

**Production**:
- Uses Azure PostgreSQL Flexible Server
- Credentials managed by Terraform
- SSL/TLS required
- Firewall rules restrict access

---

Need help? See [docs/database-setup.md](docs/database-setup.md) for comprehensive documentation.
