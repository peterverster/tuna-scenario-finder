# Configuration Guide

This document explains how configuration and secrets are managed in BlackSwans.ai.

## Architecture Overview

Configuration follows a **layered approach** separating structure from secrets:

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURATION LAYERS                      │
├─────────────────────────────────────────────────────────────┤
│  4. Environment Variables (.envrc)     ← SECRETS ONLY       │
│  3. config/local.toml                  ← Machine-specific   │
│  2. config/{environment}.toml          ← Environment        │
│  1. config/base.toml                   ← Defaults           │
└─────────────────────────────────────────────────────────────┘
         Higher layers override lower layers
```

## File Structure

```
blackswans/
├── config/                      # Configuration files (project root)
│   ├── base.toml               # Foundation defaults (committed)
│   ├── development.toml        # Development overrides (committed)
│   ├── production.toml         # Production overrides (committed)
│   ├── local.toml.example      # Template for local config (committed)
│   └── local.toml              # YOUR machine settings (git-ignored)
│
├── src/config/                  # Python package for loading
│   ├── __init__.py             # Exports: Settings, get_settings
│   ├── loader.py               # TOML loading with deep merge
│   ├── secrets.py              # Environment-only secrets (Pydantic)
│   └── settings.py             # Typed Settings class
│
├── .envrc                       # Secrets via direnv (git-ignored)
└── .env                         # Legacy secrets (git-ignored, optional)
```

## Configuration vs Secrets

### TOML Files (config/*.toml) - Structure & Non-Sensitive Values

```toml
# config/base.toml - Defaults for ALL environments
[database]
pool_size = 5
max_overflow = 10

[database.connection]
driver = "postgresql+asyncpg"
host = "localhost"
port = 5432
name = "postgres"
user = "postgres"
# password: NEVER HERE - use POSTGRES_PASSWORD env var
```

```toml
# config/local.toml - YOUR machine (git-ignored)
[database.connection]
name = "blackswans_dev"
user = "pv"  # Your macOS username for Postgres.app

[temporal]
address = "eu-west-1.aws.api.temporal.io:7233"
namespace = "blackswans.d1z4e"
use_tls = true
```

### Environment Variables (.envrc) - Secrets ONLY

```bash
# .envrc - Project-scoped secrets via direnv (git-ignored)

# API Keys
export PYDANTIC_AI_API_KEY="sk-ant-..."
export SCRAPINGBEE_API_KEY="..."
export TEMPORAL_API_KEY="eyJ..."

# Security
export SECRET_KEY="cryptographic-random-string"
export JWT_SECRET_KEY="another-random-string"

# Database (empty for Postgres.app)
export POSTGRES_PASSWORD=""
```

## Setup Instructions

### 1. Install direnv (Project-Scoped Secrets)

```bash
# Install
brew install direnv

# Add hook to shell (~/.zshrc or ~/.bashrc)
echo 'eval "$(direnv hook zsh)"' >> ~/.zshrc
source ~/.zshrc
```

### 2. Create Local Configuration

```bash
# Copy template
cp config/local.toml.example config/local.toml

# Edit with your machine-specific settings
# - Database user/name for your local Postgres
# - Temporal Cloud namespace (if using)
```

### 3. Create Secrets File

```bash
# Create .envrc with your API keys
cat > .envrc << 'EOF'
export PYDANTIC_AI_API_KEY="your-key"
export SCRAPINGBEE_API_KEY="your-key"
export TEMPORAL_API_KEY="your-key"
export SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
export JWT_SECRET_KEY="$(python -c 'import secrets; print(secrets.token_urlsafe(32))')"
export POSTGRES_PASSWORD=""
EOF

# Allow direnv to load it
direnv allow
```

### 4. Verify Configuration

```bash
# Check secrets are loaded
env | grep -E "(PYDANTIC|TEMPORAL|SCRAPINGBEE)"

# Test Python config loading
PYTHONPATH=src python -c "
from config import get_settings
s = get_settings()
print(f'Database: {s.database.connection.user}@{s.database.connection.host}')
print(f'Temporal: {s.temporal.address}')
api_key = s.secrets.pydantic_ai_api_key
print(f'API Key: {\"SET\" if api_key and api_key.get_secret_value() else \"NOT SET\"}')
"
```

## Configuration Sections

### Application (`[app]`)

```toml
[app]
name = "BlackSwans.ai"
version = "0.1.0"
environment = "development"    # development | staging | production
runtime_context = "worker"     # api | worker | cli | test
log_level = "INFO"             # DEBUG | INFO | WARNING | ERROR
```

### Database (`[database]`)

```toml
[database]
pool_size = 5          # Connection pool size (5 dev, 10-20 prod)
max_overflow = 10      # Extra connections for spikes
echo = false           # SQL logging (debug only)

[database.connection]
driver = "postgresql+asyncpg"
host = "localhost"
port = 5432
name = "blackswans_dev"
user = "pv"
# password via POSTGRES_PASSWORD env var
```

### Temporal (`[temporal]`)

```toml
[temporal]
address = "localhost:7233"              # Local Docker
# address = "*.tmprl.cloud:7233"        # Temporal Cloud
namespace = "default"
task_queue = "main-task-queue"
use_tls = false                         # true for Temporal Cloud
# api_key via TEMPORAL_API_KEY env var
```

### Models (`[models]`)

```toml
[models]
provider = "huggingface"    # huggingface | openai
temperature = 0.7
max_tokens = 2048
timeout = 60

[models.pydantic_ai]
model = "anthropic:claude-sonnet-4-5-20250929"
# api_key via PYDANTIC_AI_API_KEY env var
```

### Adapters (`[adapters]`)

```toml
[adapters]
content_scraper = "scrapingbee"     # scrapingbee | mock
bibtex_extractor = "pydantic-ai"    # pydantic-ai | mock
content_persistence = "postgres"     # postgres | inmemory
```

### Feature Flags (`[features]`)

```toml
[features]
enable_lens_analysis = true
enable_possibility_engine = true
enable_temporal_workflows = false
```

## Usage in Code

```python
from config import get_settings

# Get cached singleton
settings = get_settings()

# Hierarchical access (ONLY supported pattern)
settings.database.pool_size
settings.database.url                     # Computed from connection params
settings.temporal.address
settings.models.pydantic_ai.model

# Secrets via settings.secrets (SecretStr for safety)
settings.secrets.pydantic_ai_api_key      # Returns SecretStr or None
settings.secrets.temporal_api_key         # For Temporal Cloud
settings.secrets.scraping_bee_api_key     # For ScrapingBee
```

## Environment-Specific Overrides

### Development (`config/development.toml`)

```toml
[database]
echo = true  # SQL logging for debugging

[adapters]
# Can use mock adapters for faster development
# content_scraper = "mock"
```

### Production (`config/production.toml`)

```toml
[app]
environment = "production"
log_level = "WARNING"

[database]
pool_size = 20
max_overflow = 30

[temporal]
use_tls = true

[features]
enable_temporal_workflows = true
```

## Secrets Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PYDANTIC_AI_API_KEY` | Yes* | Claude/OpenAI API key for LLM operations |
| `SCRAPINGBEE_API_KEY` | Yes* | ScrapingBee API for web scraping |
| `TEMPORAL_API_KEY` | For Cloud | Temporal Cloud authentication |
| `POSTGRES_PASSWORD` | No | Database password (empty for Postgres.app) |
| `SECRET_KEY` | Yes | Application encryption key |
| `JWT_SECRET_KEY` | Yes | JWT token signing key |
| `HUGGINGFACE_API_KEY` | No | HuggingFace Inference API |
| `OPENAI_API_KEY` | No | OpenAI API (alternative to Pydantic AI) |

*Required for production; can use mock adapters for development.

## Git-Ignored Files

These files contain machine-specific or secret data and are **never committed**:

```gitignore
# Secrets
.env
.envrc
.github/secrets.env

# Local configuration
config/local.toml
```

## Troubleshooting

### direnv not loading

```bash
# Check if allowed
direnv status

# Re-allow after editing .envrc
direnv allow

# Reload shell
source ~/.zshrc
cd .  # triggers reload
```

### Settings not loading

```bash
# Clear cached settings
python -c "from config import get_settings; get_settings.cache_clear()"

# Check config directory exists
ls -la config/
```

### Missing API key errors

```bash
# Check which keys are set
env | grep -E "(PYDANTIC|SCRAPINGBEE|TEMPORAL)"

# Use mock adapters for development without keys
# Add to config/local.toml:
[adapters]
content_scraper = "mock"
bibtex_extractor = "mock"
```

## Related Documentation

- [TOML Configuration Management](./_docs/toml-configuration-management.md) - Technical specification
- [Configurator Port Pattern](./_docs/configurator-port-pattern-guide.md) - DI pattern for adapters
- [Testing Strategy](./_docs/testing-strategy.md) - How tests use configuration
