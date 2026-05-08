# Configurator Port Pattern - Implementation Guide

**Pattern**: Alistair Cockburn's Configurator Port (Hexagonal Architecture)
**Status**: Implemented
**Last Updated**: 2025-12-13

---

## Overview

The **Configurator Port Pattern** achieves complete separation between application logic and infrastructure configuration. This follows Alistair Cockburn's Hexagonal Architecture principle:

> "The application should define what it needs to be configured, not how to configure it."

### Key Insight

**Application layer is 100% pure** - it has ZERO knowledge of:
- How adapters are chosen (settings, registry, etc.)
- Which concrete adapters exist (ScrapingBee, Claude, PostgreSQL)
- How configuration is loaded (Pydantic, environment variables)

**Infrastructure layer handles ALL configuration** - it knows:
- How to read settings (Pydantic Settings from TOML + env vars)
- Which adapters are available (adapter registry)
- How to wire dependencies for different contexts (configurators)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│                  (Pure - No Infrastructure)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ConfiguratorPort (ports/configurator.py)              │    │
│  │                                                         │    │
│  │  @abstractmethod                                        │    │
│  │  def configure() -> ApplicationDependencies             │    │
│  │                                                         │    │
│  │  @abstractmethod                                        │    │
│  │  def configure_and_initialize() -> ...                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            │ returns                            │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ApplicationDependencies (dependencies.py)             │    │
│  │                                                         │    │
│  │  content_scraper: ContentScraperPort                    │    │
│  │  bibtex_extractor: BibtexExtractorPort                 │    │
│  │  content_persistence: ContentPersistencePort           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Activities use:                                                │
│    deps = get_current_dependencies()                            │
│    await deps.content_scraper.scrape(url)                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  WorkerConfigurator (configurators/worker.py)          │    │
│  │  implements ConfiguratorPort                            │    │
│  │                                                         │    │
│  │  1. Reads settings (get_settings())                     │    │
│  │  2. Looks up adapters in registry                       │    │
│  │  3. Creates ApplicationDependencies                     │    │
│  │  4. Sets global container                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            │ uses                               │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Adapter Registry (adapter_registry.py)                │    │
│  │                                                         │    │
│  │  CONTENT_SCRAPER_REGISTRY = {                           │    │
│  │    "scrapingbee": ScrapingBeeAdapter,                   │    │
│  │    "mock": MockContentScraper                           │    │
│  │  }                                                       │    │
│  │                                                         │    │
│  │  Populated by @register_content_scraper decorators      │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            │ returns                            │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Concrete Adapters                                      │    │
│  │                                                         │    │
│  │  @register_content_scraper("scrapingbee")              │    │
│  │  class ScrapingBeeAdapter(ContentScraperPort)           │    │
│  │                                                         │    │
│  │  @register_bibtex_extractor("pydantic-ai")             │    │
│  │  class PydanticAIBibtexExtractor(BibtexExtractorPort)  │    │
│  │                                                         │    │
│  │  @register_content_persistence("postgres")             │    │
│  │  class PostgresContentPersistenceService(...)           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ selected by
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      ENTRY POINT                                 │
│                                                                  │
│  infrastructure/temporal/worker.py:                              │
│    configurator = WorkerConfigurator()  # ← Selects impl        │
│    configurator.configure_and_initialize()                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## How It Works: Step-by-Step

### Step 1: Application Defines What It Needs

**File**: `src/application/ports/configurator.py`

```python
from abc import ABC, abstractmethod

class ConfiguratorPort(ABC):
    """Application defines: I need a configurator that gives me dependencies."""

    @abstractmethod
    def configure(self) -> ApplicationDependencies:
        """Wire and return my dependencies."""
        pass
```

**File**: `src/application/dependencies.py`

```python
@dataclass(frozen=True)
class ApplicationDependencies:
    """Application defines: Here's what I need to run."""
    content_scraper: ContentScraperPort       # Port type (abstraction)
    bibtex_extractor: BibtexExtractorPort     # Port type (abstraction)
    content_persistence: ContentPersistencePort  # Port type (abstraction)
```

**Critical**: Application layer has ZERO infrastructure imports. Only port types.

### Step 2: Infrastructure Provides How to Configure

**File**: `src/infrastructure/configurators/worker.py`

```python
class WorkerConfigurator(ConfiguratorPort):
    """Infrastructure says: Here's HOW I'll wire your dependencies."""

    def configure(self) -> ApplicationDependencies:
        settings = get_settings()  # Infrastructure: read from TOML + env

        # Infrastructure: use registry to lookup adapters (hierarchical access)
        scraper = get_content_scraper(settings.adapters.content_scraper)
        extractor = get_bibtex_extractor(settings.adapters.bibtex_extractor)
        persistence = get_content_persistence(settings.adapters.content_persistence)

        # Infrastructure: create container
        return ApplicationDependencies(
            content_scraper=scraper,
            bibtex_extractor=extractor,
            content_persistence=persistence
        )
```

### Step 3: Adapters Self-Register

**File**: `src/infrastructure/adapters/scraping_bee.py`

```python
from infrastructure.adapter_registry import register_content_scraper

@register_content_scraper("scrapingbee")  # ← Self-registration
class ScrapingBeeAdapter(ContentScraperPort):
    def __init__(self):
        settings = get_settings()
        self._api_key = settings.secrets.scraping_bee_api_key  # From env vars
```

When this file is imported, the decorator executes and adds:
```python
CONTENT_SCRAPER_REGISTRY["scrapingbee"] = ScrapingBeeAdapter
```

### Step 4: Settings Drive Adapter Selection

**File**: `config/base.toml`

```toml
# Production configuration
[adapters]
content_scraper = "scrapingbee"
bibtex_extractor = "pydantic-ai"
content_persistence = "postgres"
```

**File**: `src/config/settings.py`

```python
class AdaptersConfig(BaseModel):
    content_scraper: Literal["scrapingbee", "mock"] = "scrapingbee"
    bibtex_extractor: Literal["pydantic-ai", "mock"] = "pydantic-ai"
    content_persistence: Literal["postgres", "inmemory"] = "postgres"
```

### Step 5: Worker Selects Configurator

**File**: `src/infrastructure/temporal/worker.py`

```python
async def run_worker():
    # Entry point (infrastructure) selects which configurator
    from infrastructure.configurators import WorkerConfigurator

    configurator = WorkerConfigurator()  # ← Infrastructure decision
    configurator.configure_and_initialize()  # ← Wires dependencies

    # Dependencies now available to activities
```

### Step 6: Activities Access Dependencies

**File**: `src/application/activities/ingestion_activities.py`

```python
from application.dependencies import get_current_dependencies

@activity.defn
async def scrape_content_activity(url: str):
    deps = get_current_dependencies()  # ← Gets wired dependencies
    return await deps.content_scraper.scrape(url)
    # Uses whatever adapter was configured (ScrapingBee in production)
```

---

## The Complete Flow

```
1. Worker Starts
   ↓
2. Worker selects WorkerConfigurator
   ↓
3. WorkerConfigurator.configure():
   a. Reads settings (CONTENT_SCRAPER_ADAPTER=scrapingbee)
   b. Looks up in registry (CONTENT_SCRAPER_REGISTRY["scrapingbee"])
   c. Gets ScrapingBeeAdapter class
   d. Instantiates ScrapingBeeAdapter()
   e. Returns ApplicationDependencies(content_scraper=instance)
   ↓
4. WorkerConfigurator.configure_and_initialize():
   a. Calls configure()
   b. Calls set_current_dependencies(deps)
   c. Stores in global variable
   ↓
5. Activity executes
   ↓
6. Activity calls get_current_dependencies()
   ↓
7. Activity uses deps.content_scraper.scrape(url)
   ↓
8. ScrapingBeeAdapter.scrape() executes
```

---

## Configuration-Driven Behavior

### Production Configuration

**File**: `config/base.toml`

```toml
[adapters]
content_scraper = "scrapingbee"
bibtex_extractor = "pydantic-ai"
content_persistence = "postgres"
```

**File**: `.envrc` (secrets via direnv)

```bash
export SCRAPINGBEE_API_KEY=your_key_here
export PYDANTIC_AI_API_KEY=sk-ant-...
export POSTGRES_PASSWORD=your_password
```

**Result**: Worker uses real adapters (ScrapingBee API, Claude API, PostgreSQL)

### Test Configuration

**File**: `config/local.toml` (git-ignored)

```toml
[adapters]
content_scraper = "mock"
bibtex_extractor = "mock"
content_persistence = "inmemory"
```

**Result**: Worker uses mock adapters (no external calls, in-memory storage)

### How to Switch

**Option 1**: Edit `config/local.toml`, restart worker
```toml
[adapters]
content_scraper = "mock"  # ← Change here only!
```
```bash
# Restart worker
python scripts/run_worker.py
# Now uses MockContentScraper!
```

**Option 2**: Create environment-specific TOML
```bash
# config/testing.toml uses mock adapters
APP_ENV=testing python scripts/run_worker.py
```

---

## Adding New Adapters

### Example: Adding NewsAPI Scraper

**Step 1**: Create adapter with self-registration

**File**: `src/infrastructure/adapters/newsapi_scraper.py`

```python
from infrastructure.adapter_registry import register_content_scraper
from domain.ports.content_scraper import ContentScraperPort, ScrapedContent
from config import get_settings

@register_content_scraper("newsapi")  # ← Self-registers
class NewsAPIAdapter(ContentScraperPort):
    def __init__(self):
        settings = get_settings()
        self._api_key = settings.newsapi_api_key

    async def scrape(self, url: str) -> ScrapedContent:
        # Implementation using NewsAPI
        pass
```

**Step 2**: Add settings

**File**: `src/config/settings.py`

```python
class AdaptersConfig(BaseModel):
    # Add new adapter option
    content_scraper: Literal["scrapingbee", "newsapi", "mock"] = "scrapingbee"
```

**File**: `src/config/secrets.py`

```python
class Secrets(BaseSettings):
    newsapi_api_key: SecretStr | None = Field(default=None)
```

**Step 3**: Configure in `config/local.toml` + `.envrc`

```toml
# config/local.toml
[adapters]
content_scraper = "newsapi"
```

```bash
# .envrc
export NEWSAPI_API_KEY=your_newsapi_key
```

**Step 4**: Restart worker

```bash
python scripts/run_worker.py
# Automatically uses NewsAPIAdapter!
```

**That's it!** No changes to:
- ❌ `dependencies.py` (no if/elif to add)
- ❌ `WorkerConfigurator` (uses registry automatically)
- ❌ Activities (still call `deps.content_scraper.scrape()`)

---

## Dependency Injection Flow

### 1. Worker Startup

**File**: `src/infrastructure/temporal/worker.py`

```python
async def run_worker():
    # 1. Infrastructure selects configurator
    from infrastructure.configurators import WorkerConfigurator

    # 2. Create configurator instance
    configurator = WorkerConfigurator()

    # 3. Configure and initialize dependencies
    configurator.configure_and_initialize()
    # This calls:
    #   deps = configure()
    #   set_current_dependencies(deps)
```

### 2. Configuration Phase

**File**: `src/infrastructure/configurators/worker.py`

```python
def configure(self) -> ApplicationDependencies:
    settings = get_settings()

    # Registry pattern: lookup by name from settings (hierarchical access)
    scraper = get_content_scraper(settings.adapters.content_scraper)
    # If settings.adapters.content_scraper == "scrapingbee":
    #   Returns ScrapingBeeAdapter() from registry

    extractor = get_bibtex_extractor(settings.adapters.bibtex_extractor)
    persistence = get_content_persistence(settings.adapters.content_persistence)

    return ApplicationDependencies(
        content_scraper=scraper,
        bibtex_extractor=extractor,
        content_persistence=persistence
    )
```

### 3. Registry Lookup

**File**: `src/infrastructure/adapter_registry.py`

```python
# Registry populated by decorators
CONTENT_SCRAPER_REGISTRY = {
    "scrapingbee": ScrapingBeeAdapter,  # From @register decorator
}

def get_content_scraper(name: str) -> ContentScraperPort:
    adapter_class = CONTENT_SCRAPER_REGISTRY[name]
    return adapter_class()  # Instantiate and return
```

### 4. Global Container Initialization

**File**: `src/application/dependencies.py`

```python
_dependencies: ApplicationDependencies | None = None

def set_current_dependencies(deps: ApplicationDependencies) -> None:
    global _dependencies
    _dependencies = deps  # Store globally for activities
```

### 5. Activity Access

**File**: `src/application/activities/ingestion_activities.py`

```python
@activity.defn
async def scrape_content_activity(url: str) -> ScrapedContent:
    deps = get_current_dependencies()  # ← Gets from global
    return await deps.content_scraper.scrape(url)
    # deps.content_scraper is ScrapingBeeAdapter instance
    # (or MockContentScraper if configured)
```

---

## Why This Pattern?

### Problem: Hardcoded Dependencies

**Before** (bad):
```python
# Activity hardcoded adapter ❌
@activity.defn
async def scrape_content_activity(url: str):
    adapter = ScrapingBeeAdapter()  # ← Hardcoded!
    return await adapter.scrape(url)
```

**Issues**:
- ❌ Can't test without real ScrapingBee API
- ❌ Can't swap to different scraper
- ❌ Configuration scattered across activities
- ❌ Activity knows about concrete adapter

### Solution: Configurator Port Pattern

**After** (good):
```python
# Activity uses injected port ✅
@activity.defn
async def scrape_content_activity(url: str):
    deps = get_current_dependencies()
    return await deps.content_scraper.scrape(url)  # ← Port interface
```

**Benefits**:
- ✅ Test with mock: `CONTENT_SCRAPER_ADAPTER=mock`
- ✅ Swap scrapers: Edit .env, restart worker
- ✅ Configuration centralized in configurator
- ✅ Activity depends on abstraction (DIP)

---

## Testing with Mocks

### Production Setup

**File**: `config/base.toml`

```toml
[adapters]
content_scraper = "scrapingbee"
bibtex_extractor = "pydantic-ai"
content_persistence = "postgres"
```

**Worker uses**:
- Real ScrapingBee API calls
- Real Claude API calls
- Real PostgreSQL database

### Test Setup

**File**: `config/local.toml`

```toml
[adapters]
content_scraper = "mock"
bibtex_extractor = "mock"
content_persistence = "inmemory"
```

**Worker uses**:
- MockContentScraper (returns canned responses)
- MockBibtexExtractor (returns mock metadata)
- InMemoryContentPersistence (no database)

### Implementing Mock Adapters

**File**: `src/infrastructure/adapters/mock_scraper.py`

```python
from infrastructure.adapter_registry import register_content_scraper
from application.ports.driven.for_scraping_content import ForScrapingContent, ScrapedContent

@register_content_scraper("mock")
class MockContentScraper(ForScrapingContent):
    """Mock scraper for testing - returns canned responses."""

    async def scrape(self, url: str) -> ScrapedContent:
        return ScrapedContent(
            title="Mock Article Title",
            text="Mock article text content",
            markdown="# Mock Article\n\nMock content",
            source_url=url
        )
```

**That's it!** Now run tests with mock adapters:
```bash
# Unit tests automatically use TestConfigurator (mocks)
pytest -m unit
```

---

## Multiple Deployment Contexts

The pattern supports different configurators for different contexts:

### Worker Context

```python
# infrastructure/configurators/worker.py
class WorkerConfigurator(ConfiguratorPort):
    """Worker-specific configuration."""
    # - Uses production adapters
    # - No auth provider (workers don't authenticate)
    # - Optimized for long-running processes
```

### API Context (Future)

```python
# infrastructure/configurators/api.py
class APIConfigurator(ConfiguratorPort):
    """API-specific configuration."""
    # - Uses production adapters
    # - Includes auth provider
    # - Optimized for request/response
```

### Test Context (Future)

```python
# infrastructure/configurators/testing.py
class TestConfigurator(ConfiguratorPort):
    """Test-specific configuration."""
    # - Uses mock adapters
    # - No external dependencies
    # - Fast and deterministic
```

### Usage

```python
# In worker entry point
configurator = WorkerConfigurator()

# In API entry point
configurator = APIConfigurator()

# In test fixtures
configurator = TestConfigurator()
```

---

## Real Example: BlackSwans.ai Workflow

### Production Workflow Execution

**1. Worker Starts** (`scripts/run_worker.py`):
```bash
$ python scripts/run_worker.py
```

**2. Worker Initializes Dependencies**:
```
[info] Configuring worker dependencies via WorkerConfigurator...
[info] Configuring worker dependencies from settings
       scraper_adapter=scrapingbee
       extractor_adapter=pydantic-ai
       persistence_adapter=postgres
[info] ScrapingBee fetcher initialized
[info] Dependencies wired successfully
       scraper=ScrapingBeeAdapter
       extractor=PydanticAIBibtexExtractor
       persistence=PostgresContentPersistenceService
[info] Worker dependencies configured successfully
[info] Worker started task_queue=default
```

**3. Workflow Triggered**:
```python
await client.start_workflow(
    ContentIngestionWorkflow.run,
    args=["https://www.theverge.com/..."],
    id="content-ingestion-123",
    task_queue="default"
)
```

**4. Workflow Executes Activities**:
```python
# Step 1: Scrape
scraped_content = await workflow.execute_activity(
    "scrape_content_activity",
    url
)
# ↓ Activity gets dependencies
# deps = get_current_dependencies()
# ↓ Uses configured adapter
# deps.content_scraper.scrape(url)
# ↓ Executes ScrapingBeeAdapter.scrape()
# ↓ Calls real ScrapingBee API
```

**5. Complete Pipeline**:
```
URL → scrape_content_activity (ScrapingBeeAdapter)
    → extract_bibtex_activity (PydanticAIBibtexExtractor - Claude API)
    → save_content_item_activity (PostgresContentPersistenceService)
    → Database
```

---

## Motivation: Why We Did This

### 1. Separation of Concerns

**Problem**: Application code was mixed with configuration logic.

**Solution**: Application defines interfaces, infrastructure provides implementations.

### 2. Testability

**Problem**: Hard to test without real external services (ScrapingBee, Claude, PostgreSQL).

**Solution**: Configure mocks via .env:
```bash
CONTENT_SCRAPER_ADAPTER=mock
# Run tests - no real API calls!
```

### 3. Flexibility

**Problem**: Changing providers required code changes in multiple places.

**Solution**: Change in ONE place (`.env` file):
```bash
CONTENT_SCRAPER_ADAPTER=newsapi  # ← One line change!
# Restart worker - done!
```

### 4. Multiple Environments

**Problem**: Same code needs different adapters (dev/staging/prod).

**Solution**: Different `.env` files:
```bash
# .env.dev
CONTENT_SCRAPER_ADAPTER=mock

# .env.prod
CONTENT_SCRAPER_ADAPTER=scrapingbee
```

### 5. Ports & Adapters Compliance

**Problem**: Application layer had infrastructure imports (violated architecture).

**Solution**: Application layer is now 100% pure:
```python
# application/dependencies.py
from dataclasses import dataclass
from domain.ports.content_scraper import ContentScraperPort  # ✅ Port only

# NO infrastructure imports! ✅
```

---

## Key Files Reference

### Application Layer (Pure)

| File | Purpose | Imports |
|------|---------|---------|
| `application/ports/configurator.py` | Define configuration interface | Ports only |
| `application/dependencies.py` | Dependency container | Ports only |
| `application/activities/` | Business logic | Ports only |
| `application/workflows/` | Use case orchestration | Ports only |

**NO infrastructure imports in application layer!**

### Infrastructure Layer (Configuration)

| File | Purpose |
|------|---------|
| `infrastructure/configurators/worker.py` | Worker configuration implementation |
| `infrastructure/adapter_registry.py` | Self-registering adapter registry |
| `infrastructure/adapters/scraping_bee.py` | ScrapingBee adapter (self-registers) |
| `infrastructure/adapters/bibtex_extractor.py` | Claude adapter (self-registers) |
| `infrastructure/adapters/content_persistence_service.py` | PostgreSQL adapter (self-registers) |

### Configuration Files

| File | Purpose |
|------|---------|
| `src/config/settings.py` | Pydantic Settings (typed config models) |
| `config/base.toml` | Base configuration (committed) |
| `config/{env}.toml` | Environment overrides (committed) |
| `config/local.toml` | Personal overrides (git-ignored) |
| `.envrc` | Secrets via direnv (git-ignored) |

---

## Troubleshooting

### "Dependencies not initialized" Error

**Error**:
```
RuntimeError: ApplicationDependencies not initialized.
Call configurator.configure_and_initialize() in entry point.
```

**Cause**: Configurator not called before accessing dependencies.

**Fix**:
```python
# In worker startup
configurator = WorkerConfigurator()
configurator.configure_and_initialize()  # ← Must call this!
```

### "Unknown adapter" Error

**Error**:
```
ValueError: Unknown content scraper: 'newsapi'.
Available: scrapingbee.
Register with @register_content_scraper decorator.
```

**Cause**: Adapter not registered in registry.

**Fix**: Add `@register_content_scraper("newsapi")` decorator to adapter class.

### Mock Adapters Not Available

**Error**:
```
ValueError: Unknown content scraper: 'mock'.
```

**Cause**: Mock adapters not implemented yet (TODO).

**Fix**: Implement mock adapters or use production adapters for now.

---

## Summary

### Pattern Benefits

✅ **Clean Architecture**: Application layer 100% pure (no infrastructure)
✅ **Configurability**: Change adapters via .env (no code changes)
✅ **Testability**: Mock adapters via configuration
✅ **Extensibility**: Add adapters via decorator (one place)
✅ **DIP Compliance**: Activities depend on ports (abstractions)

### Pattern Components

1. **ConfiguratorPort** (application/ports/) - Interface
2. **WorkerConfigurator** (infrastructure/configurators/) - Implementation
3. **ApplicationDependencies** (application/) - Container
4. **Adapter Registry** (infrastructure/) - Self-registration
5. **Settings** (config.py) - Adapter selection

### To Change Adapters

**Only ONE file to edit**: `config/local.toml`

```toml
[adapters]
content_scraper = "<new_adapter>"
```

Restart worker - done!

---

## References

- **Specification**: `_specification/configurator-port-pattern.md`
- **Alistair Cockburn**: Hexagonal Architecture pattern
- **Implementation**:
  - Application: `src/application/ports/configurator.py`
  - Infrastructure: `src/infrastructure/configurators/worker.py`
- **ADR**: `_research/2025-12-13-temporal-workflow-layer-refactoring.md`

---

**Last Tested**: 2025-12-13
**Status**: ✅ Production-ready
**E2E Test**: ✅ Passing (workflow completes, data persisted)
