Looking at your existing setup, the migration is clean — you keep all the Pydantic models and validation, but change the source from flat `.env` to hierarchical TOML + injected secrets.

## Migration Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT (.env)                               │
│  DATABASE_URL=postgresql+asyncpg://...                          │
│  ANTHROPIC_API_KEY=sk-ant-...                                   │
│  TEMPORAL_ADDRESS=localhost:7233                                │
│  CONTENT_SCRAPER_ADAPTER=scrapingbee                            │
│  ... (flat key-value pairs)                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    NEW (TOML + Secrets)                         │
│  config/base.toml      → Structure, defaults, adapter selection │
│  config/development.toml → Dev overrides                        │
│  config/production.toml  → Prod overrides                       │
│  config/local.toml       → Personal (git-ignored)               │
│  Environment vars        → Secrets only (API keys, passwords)   │
└─────────────────────────────────────────────────────────────────┘
```

## File Structure

```
config/
  base.toml              # committed - structure & defaults
  development.toml       # committed - dev environment
  production.toml        # committed - prod environment  
  local.toml             # git-ignored - personal overrides
  local.toml.example     # committed - template
  
  settings.py            # your existing file, modified
  secrets.py             # new - handles secret injection
  loader.py              # new - TOML loading & merging
```

## TOML Configuration Files

```toml
# config/base.toml
[app]
name = "BlackSwans.ai"
version = "0.1.0"
environment = "development"
runtime_context = "worker"
log_level = "INFO"

[database]
# Structure only - password injected from secrets
pool_size = 5
max_overflow = 10
echo = false

[database.connection]
driver = "postgresql+asyncpg"
host = "localhost"
port = 5432
name = "postgres"
user = "postgres"
# password intentionally absent

[elasticsearch]
url = "http://localhost:9200"
index_prefix = "blackswans_dev"
timeout = 30

[temporal]
address = "localhost:7233"
namespace = "default"
task_queue = "main-task-queue"
use_tls = false

[models]
provider = "huggingface"  # or "openai"
temperature = 0.7
max_tokens = 2048
timeout = 60

[models.huggingface]
embedding_model = "mixedbread-ai/mxbai-embed-large-v1"

[models.openai]
embedding_model = "text-embedding-3-large"

[models.pydantic_ai]
model = "openai:gpt-4o-mini"

[security]
jwt_algorithm = "HS256"
jwt_expiration_minutes = 60

[cors]
origins = ["http://localhost:3000", "http://localhost:8000"]
allow_credentials = true

# Adapter selection - mirrors your existing Literal types
[adapters]
content_scraper = "scrapingbee"    # scrapingbee | mock
bibtex_extractor = "pydantic-ai"  # pydantic-ai | mock
content_persistence = "postgres"   # postgres | inmemory

[features]
enable_lens_analysis = true
enable_possibility_engine = true
enable_temporal_workflows = false
```

```toml
# config/production.toml
[app]
environment = "production"
log_level = "WARNING"

[database]
pool_size = 10
max_overflow = 20

[database.connection]
host = "prod-db.internal"
name = "blackswans_prod"

[elasticsearch]
url = "https://elasticsearch.internal:9200"
index_prefix = "blackswans_prod"

[temporal]
address = "blackswans.tmprl.cloud:7233"
namespace = "production"
use_tls = true

[features]
enable_temporal_workflows = true
```

```toml
# config/local.toml.example (committed as template)
# Copy to config/local.toml and customise
# This file is git-ignored

[database.connection]
host = "localhost"
name = "blackswans_dev"
user = "your_user"

# Secrets should be set as environment variables:
# export POSTGRES_PASSWORD="your-password"
# export OPENAI_API_KEY="sk-..."
# export ANTHROPIC_API_KEY="sk-ant-..."
#
# Or use direnv - see .envrc.example
```

## Updated Pydantic Settings

```python
# config/loader.py
"""TOML configuration loader with environment layering."""

import tomllib
from functools import reduce
from pathlib import Path
from typing import Any


def deep_merge(base: dict[str, Any], override: dict[str, Any]) -> dict[str, Any]:
    """Recursively merge override into base."""
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = deep_merge(result[key], value)
        else:
            result[key] = value
    return result


def load_toml_chain(config_dir: Path, environment: str) -> dict[str, Any]:
    """Load and merge TOML files: base → environment → local."""
    paths = [
        config_dir / "base.toml",
        config_dir / f"{environment}.toml",
        config_dir / "local.toml",
    ]
    
    configs = []
    for path in paths:
        if path.exists():
            with open(path, "rb") as f:
                configs.append(tomllib.load(f))
    
    return reduce(deep_merge, configs, {})
```

```python
# config/secrets.py
"""Secrets loaded exclusively from environment variables.

PRINCIPLE: Secrets never in files, always injected at runtime.
SOURCE: Environment variables (local) or GitHub Secrets (CI/CD).
"""

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Secrets(BaseSettings):
    """Secret values - loaded only from environment variables."""
    
    model_config = SettingsConfigDict(
        env_prefix="",
        extra="ignore",
    )
    
    # Database
    postgres_password: SecretStr = Field(
        default=SecretStr(""),
        alias="POSTGRES_PASSWORD",
    )
    
    # ML/AI Providers
    huggingface_api_key: SecretStr | None = Field(
        default=None,
        alias="HUGGINGFACE_API_KEY",
    )
    openai_api_key: SecretStr | None = Field(
        default=None,
        alias="OPENAI_API_KEY",
    )
    pydantic_ai_api_key: SecretStr | None = Field(
        default=None,
        alias="PYDANTIC_AI_API_KEY",
    )
    
    # Scraping
    scraping_bee_api_key: SecretStr | None = Field(
        default=None,
        alias="SCRAPINGBEE_API_KEY",
    )
    
    # Temporal
    temporal_api_key: SecretStr | None = Field(
        default=None,
        alias="TEMPORAL_API_KEY",
    )
    
    # Security
    secret_key: SecretStr = Field(
        default=SecretStr("change-me-in-production"),
        alias="SECRET_KEY",
    )
    jwt_secret_key: SecretStr = Field(
        default=SecretStr("change-me-in-production"),
        alias="JWT_SECRET_KEY",
    )
```

```python
# config/settings.py
"""Application configuration using TOML + Pydantic Settings.

CONFIGURATION SOURCES (in order of precedence):
1. config/base.toml        - Structure and defaults (committed)
2. config/{environment}.toml - Environment overrides (committed)
3. config/local.toml       - Personal overrides (git-ignored)
4. Environment variables   - Secrets only (never in files)

ARCHITECTURAL PATTERN: Configuration Layer (Cross-Cutting Concern)
- TOML files define structure, hierarchy, and non-sensitive values
- Secrets injected from environment variables at runtime
- Pydantic validates and types everything at startup
"""

import os
from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, SecretStr, computed_field, field_validator

from config.loader import load_toml_chain
from config.secrets import Secrets


# ============================================================================
# COMPONENT CONFIGS (typed subsections)
# ============================================================================

class DatabaseConnectionConfig(BaseModel):
    """Database connection parameters."""
    driver: str = "postgresql+asyncpg"
    host: str = "localhost"
    port: int = 5432
    name: str = "postgres"
    user: str = "postgres"
    password: SecretStr = Field(default=SecretStr(""))
    
    @computed_field
    @property
    def url(self) -> str:
        """Construct database URL from components."""
        pwd = self.password.get_secret_value()
        return f"{self.driver}://{self.user}:{pwd}@{self.host}:{self.port}/{self.name}"


class DatabaseConfig(BaseModel):
    """Database configuration."""
    connection: DatabaseConnectionConfig = DatabaseConnectionConfig()
    pool_size: int = Field(default=5, ge=1, le=20)
    max_overflow: int = Field(default=10, ge=0, le=50)
    echo: bool = False
    
    @computed_field
    @property
    def url(self) -> str:
        """Database URL (delegated to connection)."""
        return self.connection.url


class ElasticsearchConfig(BaseModel):
    """Elasticsearch configuration."""
    url: str = "http://localhost:9200"
    index_prefix: str = "blackswans_dev"
    timeout: int = Field(default=30, ge=5, le=300)


class TemporalConfig(BaseModel):
    """Temporal workflow configuration."""
    address: str = "localhost:7233"
    namespace: str = "default"
    task_queue: str = "main-task-queue"
    use_tls: bool = False
    api_key: SecretStr = Field(default=SecretStr(""))


class HuggingFaceConfig(BaseModel):
    """HuggingFace model configuration."""
    embedding_model: str = "mixedbread-ai/mxbai-embed-large-v1"
    api_key: SecretStr = Field(default=SecretStr(""))


class OpenAIConfig(BaseModel):
    """OpenAI model configuration."""
    embedding_model: str = "text-embedding-3-large"
    api_key: SecretStr = Field(default=SecretStr(""))


class PydanticAIConfig(BaseModel):
    """Pydantic-AI configuration."""
    model: str = "openai:gpt-4o-mini"
    api_key: SecretStr = Field(default=SecretStr(""))


class ModelsConfig(BaseModel):
    """ML/AI models configuration."""
    provider: Literal["huggingface", "openai"] = "huggingface"
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=100, le=32000)
    timeout: int = Field(default=60, ge=10, le=600)
    huggingface: HuggingFaceConfig = HuggingFaceConfig()
    openai: OpenAIConfig = OpenAIConfig()
    pydantic_ai: PydanticAIConfig = PydanticAIConfig()


class SecurityConfig(BaseModel):
    """Security configuration."""
    secret_key: SecretStr = Field(default=SecretStr("change-me"))
    jwt_secret_key: SecretStr = Field(default=SecretStr("change-me"))
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = Field(default=60, ge=5, le=10080)


class CorsConfig(BaseModel):
    """CORS configuration."""
    origins: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    allow_credentials: bool = True


class AdaptersConfig(BaseModel):
    """Adapter selection configuration."""
    content_scraper: Literal["scrapingbee", "mock"] = "scrapingbee"
    bibtex_extractor: Literal["pydantic-ai", "mock"] = "pydantic-ai"
    content_persistence: Literal["postgres", "inmemory"] = "postgres"


class FeaturesConfig(BaseModel):
    """Feature flags."""
    enable_lens_analysis: bool = True
    enable_possibility_engine: bool = True
    enable_temporal_workflows: bool = False


class AppConfig(BaseModel):
    """Application metadata."""
    name: str = "BlackSwans.ai"
    version: str = "0.1.0"
    environment: Literal["development", "staging", "production"] = "development"
    runtime_context: Literal["api", "worker", "cli", "test"] = "worker"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"


# ============================================================================
# ROOT SETTINGS
# ============================================================================

class Settings(BaseModel):
    """Application settings - TOML structure + injected secrets.

    PATTERN: Hierarchical configuration with typed components.
    ACCESS: Hierarchical only (no backward-compatible flat properties).
    SECRETS: Access via settings.secrets.* for environment secrets.
    """

    app: AppConfig = AppConfig()
    database: DatabaseConfig = DatabaseConfig()
    elasticsearch: ElasticsearchConfig = ElasticsearchConfig()
    temporal: TemporalConfig = TemporalConfig()
    models: ModelsConfig = ModelsConfig()
    security: SecurityConfig = SecurityConfig()
    cors: CorsConfig = CorsConfig()
    adapters: AdaptersConfig = AdaptersConfig()
    features: FeaturesConfig = FeaturesConfig()

    @property
    def secrets(self) -> "Secrets":
        """Access secrets loaded from environment variables."""
        return object.__getattribute__(self, "_secrets")

    @classmethod
    def load(cls, environment: str | None = None) -> "Settings":
        """Load settings from TOML chain + inject secrets."""
        env = environment or os.getenv("APP_ENV", "development")
        config_dir = Path(__file__).parent
        
        # 1. Load TOML hierarchy
        config_data = load_toml_chain(config_dir, env)
        
        # 2. Load secrets from environment
        secrets = Secrets()
        
        # 3. Inject secrets into config structure
        cls._inject_secrets(config_data, secrets)
        
        # 4. Validate and return typed settings
        settings = cls.model_validate(config_data)

        # 5. Store secrets for access via settings.secrets
        object.__setattr__(settings, "_secrets", secrets)

        return settings
    
    @staticmethod
    def _inject_secrets(config: dict, secrets: Secrets) -> None:
        """Inject secret values into config structure."""
        # Database password
        if "database" in config:
            config.setdefault("database", {})
            config["database"].setdefault("connection", {})
            config["database"]["connection"]["password"] = (
                secrets.postgres_password.get_secret_value()
            )
        
        # Model API keys
        if "models" in config:
            models = config["models"]
            if "huggingface" in models and secrets.huggingface_api_key:
                models["huggingface"]["api_key"] = (
                    secrets.huggingface_api_key.get_secret_value()
                )
            if "openai" in models and secrets.openai_api_key:
                models["openai"]["api_key"] = (
                    secrets.openai_api_key.get_secret_value()
                )
            if "pydantic_ai" in models and secrets.pydantic_ai_api_key:
                models["pydantic_ai"]["api_key"] = (
                    secrets.pydantic_ai_api_key.get_secret_value()
                )
        
        # Temporal API key
        if "temporal" in config and secrets.temporal_api_key:
            config["temporal"]["api_key"] = (
                secrets.temporal_api_key.get_secret_value()
            )
        
        # Security keys
        if "security" in config:
            config["security"]["secret_key"] = (
                secrets.secret_key.get_secret_value()
            )
            config["security"]["jwt_secret_key"] = (
                secrets.jwt_secret_key.get_secret_value()
            )


@lru_cache
def get_settings() -> Settings:
    """Get singleton Settings instance (cached).
    
    PATTERN: Singleton via LRU cache
    MIGRATION: Same interface as before, new implementation.
    
    TESTING:
        >>> get_settings.cache_clear()
        >>> monkeypatch.setenv("APP_ENV", "test")
        >>> settings = get_settings()
    """
    return Settings.load()


# Keep existing configure_logging() unchanged
def configure_logging() -> None:
    """Configure structured logging."""
    # ... your existing implementation
    pass
```

## GitHub Actions Integration

```yaml
# .github/workflows/deploy.yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Install uv
        uses: astral-sh/setup-uv@v4
      
      - name: Run with secrets
        env:
          APP_ENV: production
          POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          PYDANTIC_AI_API_KEY: ${{ secrets.PYDANTIC_AI_API_KEY }}
          SCRAPINGBEE_API_KEY: ${{ secrets.SCRAPINGBEE_API_KEY }}
          TEMPORAL_API_KEY: ${{ secrets.TEMPORAL_API_KEY }}
          SECRET_KEY: ${{ secrets.SECRET_KEY }}
          JWT_SECRET_KEY: ${{ secrets.JWT_SECRET_KEY }}
        run: |
          uv run python -m blackswans
```

## Local Development

```bash
# .envrc (git-ignored, used with direnv)
export APP_ENV="development"
export POSTGRES_PASSWORD="localdev"
export OPENAI_API_KEY="sk-..."
export PYDANTIC_AI_API_KEY="sk-..."
# etc.
```

## Usage Examples

Hierarchical access is the only supported pattern:

```python
from config import get_settings

settings = get_settings()

# Configuration access (hierarchical)
url = settings.database.url
adapter = settings.adapters.content_scraper
pool = settings.database.pool_size
temporal_addr = settings.temporal.address

# Secrets access (via settings.secrets)
api_key = settings.secrets.pydantic_ai_api_key  # SecretStr | None
if api_key:
    key_value = api_key.get_secret_value()
```

## Summary: What Changed

| Before (.env) | After (TOML + Secrets) |
|---------------|------------------------|
| `DATABASE_URL=postgresql+asyncpg://user:pass@...` | Structure in TOML, password from `POSTGRES_PASSWORD` |
| Flat `TEMPORAL_ADDRESS`, `TEMPORAL_NAMESPACE` | Grouped under `[temporal]` |
| Scattered adapter flags | `[adapters]` section |
| Feature flags mixed in | `[features]` section |
| All values in one flat file | Layered: base → environment → local |
| Pydantic loads from env | Pydantic validates TOML + injected secrets |

The key win: your configuration now mirrors your hexagonal architecture — adapters, features, and components are grouped logically rather than alphabetically in a flat file.