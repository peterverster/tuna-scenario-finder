# PGMac (Postgres.app) Setup - COMPLETE ✅

Your BlackSwans.ai database is now set up and ready to use on Postgres.app!

---

## ✅ What Was Set Up

### Database Created
- **Name**: `blackswans_dev`
- **User**: `pv` (your macOS username)
- **Host**: `localhost:5432`
- **Version**: PostgreSQL 18.1 (Postgres.app)

### Extensions Enabled
- ✅ `uuid-ossp` v1.1 - UUID generation
- ✅ `pg_trgm` v1.6 - Full-text search trigrams
- ✅ `btree_gin` v1.3 - GIN indexes for JSON

### Tables Created (via Alembic)
- `content_sources` - Source documents
- `content_items` - Content items/chunks
- `signals` - Detected signals
- `experts` - Domain experts
- `lens_analyses` - Analysis results
- `clippings` - User annotations
- `alembic_version` - Migration tracking

---

## 📝 Configuration

Your [.env](.env) is configured correctly:

```bash
DATABASE_URL=postgresql+asyncpg://pv@localhost:5432/blackswans_dev
```

**Important Notes**:
- ✅ Uses `asyncpg` driver (required)
- ✅ No password needed (Postgres.app uses macOS user authentication)
- ✅ Connection tested and working

---

## 🚀 Quick Commands

### Connect to Database
```bash
# Interactive psql session
./scripts/connect-db.sh

# Execute single query
./scripts/connect-db.sh -c "SELECT * FROM content_sources LIMIT 5;"

# List tables
./scripts/connect-db.sh -c "\dt"

# Describe table
./scripts/connect-db.sh -c "\d content_sources"
```

### Run Migrations
```bash
# Apply all pending migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Check current version
alembic current

# View migration history
alembic history
```

### Database Management
```bash
# Recreate database from scratch
./scripts/setup-pgmac-database.sh

# Backup database
pg_dump blackswans_dev > backup.sql

# Restore database
psql blackswans_dev < backup.sql
```

---

## 🔧 Helper Scripts

### [scripts/connect-db.sh](scripts/connect-db.sh)
- Connects to blackswans_dev database
- Automatically adds Postgres.app to PATH
- Usage: `./scripts/connect-db.sh` or `./scripts/connect-db.sh -c "query"`

### [scripts/setup-pgmac-database.sh](scripts/setup-pgmac-database.sh)
- Full database setup script for Postgres.app
- Creates database, enables extensions, runs migrations
- Usage: `./scripts/setup-pgmac-database.sh`

---

## 📊 Database Status

**Current Tables**: 7 tables

| Table | Purpose |
|-------|---------|
| `content_sources` | Source documents (web, PDF, etc.) |
| `content_items` | Text chunks/segments |
| `signals` | Detected weak signals |
| `experts` | Domain experts with weights |
| `lens_analyses` | Analysis results (PESTLE, etc.) |
| `clippings` | User annotations |
| `alembic_version` | Migration version tracking |

**Schema Location**: [src/infrastructure/database/models.py](src/infrastructure/database/models.py)

**Migrations**: [alembic/versions/](alembic/versions/)

---

## 🧪 Testing Connection

Test from Python:
```python
from config import get_settings
from infrastructure.database.engine import get_engine

settings = get_settings()
engine = get_engine()

# Connection string
print(settings.database_url)
# Output: postgresql+asyncpg://pv@localhost:5432/blackswans_dev
```

Test from command line:
```bash
# Quick connection test
psql -d blackswans_dev -c "SELECT current_database(), current_user;"

# Or use helper script
./scripts/connect-db.sh -c "SELECT version();"
```

---

## 🔍 Postgres.app Specifics

### PATH Configuration
Postgres.app is not in your system PATH by default. The helper scripts automatically add it:
```bash
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
```

To add permanently, add this line to `~/.zshrc` (or `~/.bashrc`):
```bash
# Add Postgres.app to PATH
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
```

### Authentication
- **No password required** for local connections
- Uses your macOS username (`pv`)
- Authentication method: `trust` or `peer` for local connections
- Perfect for development, not for production

### Starting/Stopping
- Open **Postgres.app** from Applications
- Click **Start** to start the server
- Click **Stop** to stop the server
- Or use menu bar icon for quick access

---

## 📚 Documentation

- **Database Setup Guide**: [docs/database-setup.md](docs/database-setup.md)
- **Quick Start**: [DATABASE-QUICKSTART.md](DATABASE-QUICKSTART.md)
- **Domain Schema**: [_domain/database-schema-pattern.md](_domain/database-schema-pattern.md)
- **Postgres.app Docs**: https://postgresapp.com/documentation/

---

## 🆘 Troubleshooting

### "Connection refused"
1. Check if Postgres.app is running (look for elephant icon in menu bar)
2. Open Postgres.app and ensure server is started
3. Verify port 5432 is not used by another PostgreSQL instance

### "Database does not exist"
```bash
# Recreate database
./scripts/setup-pgmac-database.sh
```

### "psql command not found"
```bash
# Temporarily add to PATH
export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"

# Or use helper scripts which do this automatically
./scripts/connect-db.sh
```

### "Migration errors"
```bash
# Check current migration state
alembic current

# Reset to latest
alembic stamp head
alembic upgrade head
```

---

## ✅ Verification Checklist

All of these should work now:

- [x] Database `blackswans_dev` created
- [x] Extensions enabled (uuid-ossp, pg_trgm, btree_gin)
- [x] Alembic migrations applied (7 tables created)
- [x] Python connection tested (asyncpg working)
- [x] .env file configured correctly
- [x] Helper scripts created and tested

---

## 🎯 Next Steps

Your database is ready! You can now:

1. **Start the API**:
   ```bash
   uvicorn src.main:app --reload
   ```

2. **Run tests**:
   ```bash
   pytest
   ```

3. **Add seed data** (if needed):
   ```bash
   python scripts/seed_database.py
   ```

4. **Check API health**:
   ```bash
   curl http://localhost:8000/api/v1/health
   ```

---

**Setup completed on**: 2025-12-13
**PostgreSQL Version**: 18.1 (Postgres.app)
**Database**: blackswans_dev
**Status**: ✅ Ready for development
