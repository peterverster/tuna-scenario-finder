# Configurator Pattern and Mocking Guide

This guide explains how to use the Configurator Pattern with Dependency Injection (DI) and mocks for testing in BlackSwans.ai. Understanding these patterns is essential for writing isolated, fast, and reliable tests.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [The Configurator Pattern](#the-configurator-pattern)
3. [Dependency Injection Container](#dependency-injection-container)
4. [Adapter Registry (Self-Registering Factory)](#adapter-registry-self-registering-factory)
5. [Mock Adapters](#mock-adapters)
6. [Writing Tests with Mocks](#writing-tests-with-mocks)
7. [Dynamic Mock Configuration](#dynamic-mock-configuration)
8. [Quick Reference](#quick-reference)

---

## Architecture Overview

The codebase follows **Ports & Adapters (Hexagonal) Architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                        ENTRY POINTS                              │
│     (conftest.py, worker.py, api.py)                            │
│                           │                                      │
│                    ┌──────▼──────┐                              │
│                    │ Configurator │  ◄── Selects adapters       │
│                    └──────┬──────┘                              │
│                           │                                      │
│              ┌────────────▼────────────┐                        │
│              │  ApplicationDependencies │  ◄── DI Container     │
│              │  (holds all ports)       │                        │
│              └────────────┬────────────┘                        │
│                           │                                      │
├───────────────────────────┼─────────────────────────────────────┤
│  APPLICATION LAYER        │                                      │
│                           ▼                                      │
│    ┌──────────────────────────────────────┐                     │
│    │   Activities / Use Cases              │                     │
│    │   - Call get_current_dependencies()   │                     │
│    │   - Use ports (ForScrapingContent,    │                     │
│    │     ForPersistingContent, etc.)       │                     │
│    └──────────────────────────────────────┘                     │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                            │
│                                                                  │
│    ┌─────────────────┐  ┌─────────────────┐                     │
│    │ Real Adapters   │  │ Mock Adapters   │                     │
│    │ - ScrapingBee   │  │ - MockScraper   │                     │
│    │ - PostgreSQL    │  │ - InMemory      │                     │
│    │ - Elasticsearch │  │ - MockEmitter   │                     │
│    └─────────────────┘  └─────────────────┘                     │
│              │                   │                               │
│              └───────┬───────────┘                               │
│                      ▼                                           │
│           ┌──────────────────┐                                  │
│           │ Adapter Registry │  ◄── Factory lookup              │
│           └──────────────────┘                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Key Principle**: Application code depends on **ports** (abstractions), not adapters (implementations). The configurator wires the appropriate adapter at runtime.

---

## The Configurator Pattern

### What is a Configurator?

A **Configurator** is responsible for wiring all application dependencies. It implements the `ForConfiguring` port and returns an `ApplicationDependencies` container.

### Available Configurators

| Configurator | Purpose | When Used |
|--------------|---------|-----------|
| `TestConfigurator` | Wire mock adapters for testing | Unit tests, integration tests |
| `WorkerConfigurator` | Wire real adapters from settings | Temporal workers |
| `APIConfigurator` | Wire real adapters from settings | FastAPI endpoints |

### Configurator Port Interface

```python
# src/application/ports/driving/for_configuring.py

class ForConfiguring(ABC):
    @abstractmethod
    def configure(self) -> ApplicationDependencies:
        """Configure and return wired dependencies."""
        pass

    def configure_and_initialize(self) -> ApplicationDependencies:
        """Configure + set in global container."""
        deps = self.configure()
        set_current_dependencies(deps)
        return deps
```

### TestConfigurator Example

```python
# src/infrastructure/configurators/testing.py

class TestConfigurator(ForConfiguring):
    """Wire mock adapters for fast, deterministic testing."""

    def configure(self) -> ApplicationDependencies:
        logger.info("Configuring TEST dependencies with mock adapters")

        # Force mock adapter selection
        content_scraper = get_content_scraper("mock")
        bibtex_extractor = get_bibtex_extractor("mock")
        article_extractor = get_article_extractor("mock")
        content_persistence = get_content_persistence("inmemory")
        event_emitter = get_event_emitter("mock")
        llm_analyzer = get_llm_analyzer("mock")
        # ... more adapters ...

        return ApplicationDependencies(
            content_scraper=content_scraper,
            bibtex_extractor=bibtex_extractor,
            article_extractor=article_extractor,
            content_persistence=content_persistence,
            event_emitter=event_emitter,
            llm_analyzer=llm_analyzer,
            # ... etc ...
        )
```

### WorkerConfigurator Example

```python
# src/infrastructure/configurators/worker.py

class WorkerConfigurator(ForConfiguring):
    """Wire real adapters based on settings (config/*.toml)."""

    def configure(self) -> ApplicationDependencies:
        settings = get_settings()  # Loads from TOML files

        # Look up adapters based on settings
        content_scraper = get_content_scraper(settings.adapters.content_scraper)
        bibtex_extractor = get_bibtex_extractor(settings.adapters.bibtex_extractor)
        content_persistence = get_content_persistence(settings.adapters.content_persistence)
        event_emitter = build_event_emitter(settings.adapters.event_emitters)
        # ... etc ...

        return ApplicationDependencies(
            content_scraper=content_scraper,
            bibtex_extractor=bibtex_extractor,
            # ... etc ...
        )
```

---

## Dependency Injection Container

### ApplicationDependencies

The DI container holds all application dependencies as **port types** (not concrete adapters):

```python
# src/application/dependencies.py

@dataclass(frozen=True)
class ApplicationDependencies:
    """Immutable container of application dependencies.

    CRITICAL: All fields are PORT types (abstractions), not concrete adapters.
    """

    # Content Ingestion ports
    content_scraper: ForScrapingContent
    bibtex_extractor: ForExtractingBibtex
    article_extractor: ForExtractingArticle
    markdown_converter: ForConvertingToMarkdown
    content_persistence: ForPersistingContent

    # Workflow events
    event_emitter: ForEmittingEvents
    user_context_provider: ForResolvingUserContext

    # LLM analysis
    llm_analyzer: ForAnalyzingWithLLM
    standards_extractor: ForExtractingStandards
    analysis_persistence: ForPersistingAnalysis

    # Document embedding
    hierarchy_embedder: ForEmbeddingHierarchy
    embedding_indexer: ForIndexingEmbeddings

    # File storage
    file_storage: ForStoringFiles
    storage_registry: dict[str, ForStoringFiles] | None = None

    def get_file_storage(self, provider: str) -> ForStoringFiles:
        """Service Locator: resolve provider -> adapter."""
        if self.storage_registry is None:
            raise RuntimeError("storage_registry not configured")
        return self.storage_registry[provider]
```

### Global Access Functions

```python
# Global dependency container
_dependencies: ApplicationDependencies | None = None

def set_current_dependencies(deps: ApplicationDependencies) -> None:
    """Set current dependency container (called by configurator at startup)."""
    global _dependencies
    _dependencies = deps

def get_current_dependencies() -> ApplicationDependencies:
    """Get current dependency container (called by activities/use cases)."""
    if _dependencies is None:
        raise RuntimeError(
            "ApplicationDependencies not initialized. "
            "Call configurator.configure_and_initialize() in entry point."
        )
    return _dependencies
```

### How Activities Access Dependencies

```python
# src/application/activities/ingestion_activities.py

from application.dependencies import get_current_dependencies

@activity.defn(name="scrape_content_activity")
async def scrape_content_activity(url: str) -> dict:
    """Scrape content from URL using injected scraper."""
    deps = get_current_dependencies()  # Get from global container

    # Use port - doesn't know if it's real or mock
    content = await deps.content_scraper.scrape(url)

    return content.to_dict()
```

---

## Adapter Registry (Self-Registering Factory)

### How It Works

Each port has a registry that maps string keys to adapter classes:

```python
# src/infrastructure/adapter_registry.py

# Registry storage
CONTENT_SCRAPER_REGISTRY: dict[str, type[ForScrapingContent]] = {}
EVENT_EMITTER_REGISTRY: dict[str, type[ForEmittingEvents]] = {}
LLM_ANALYZER_REGISTRY: dict[str, type[ForAnalyzingWithLLM]] = {}

# Registration decorator
def register_content_scraper(name: str) -> Callable:
    """Register a content scraper adapter with a name."""
    def decorator(cls: type[ForScrapingContent]) -> type[ForScrapingContent]:
        CONTENT_SCRAPER_REGISTRY[name] = cls
        return cls
    return decorator

# Factory function
def get_content_scraper(name: str) -> ForScrapingContent:
    """Get a content scraper by name."""
    if name not in CONTENT_SCRAPER_REGISTRY:
        available = ", ".join(CONTENT_SCRAPER_REGISTRY.keys())
        raise ValueError(f"Unknown scraper: '{name}'. Available: {available}")
    adapter_class = CONTENT_SCRAPER_REGISTRY[name]
    return adapter_class()
```

### Self-Registering Adapters

Adapters register themselves using decorators:

```python
# src/infrastructure/adapters/scraping_bee.py

@register_content_scraper("scrapingbee")
class ScrapingBeeAdapter(ForScrapingContent):
    """Real adapter - calls ScrapingBee API."""
    async def scrape(self, url: str) -> ScrapedContent:
        # Real HTTP calls to ScrapingBee
        ...

# src/infrastructure/adapters/mock_scraper.py

@register_content_scraper("mock")
class MockContentScraper(ForScrapingContent):
    """Mock adapter - returns canned content."""
    async def scrape(self, url: str) -> ScrapedContent:
        return ScrapedContent(
            title="Mock Article Title",
            raw_html="<html>...</html>",
            source_url=url,
        )
```

---

## Mock Adapters

### Design Principles

Mock adapters should:

1. **Implement the same port interface** - Full substitutability
2. **Use in-memory storage** - No external dependencies
3. **Provide test helpers** - Methods to inspect state
4. **Support state reset** - For test isolation
5. **Track calls** - For assertions about behavior

### MockContentScraper

```python
@register_content_scraper("mock")
class MockContentScraper(ForScrapingContent):
    """Mock scraper returning canned HTML content."""

    async def scrape(self, url: str) -> ScrapedContent:
        mock_html = """<!DOCTYPE html>
        <html><head><title>Mock Article</title></head>
        <body><article><h1>Mock Article Title</h1>
        <p>This is mock content for testing.</p>
        </article></body></html>"""

        return ScrapedContent(
            title="Mock Article Title",
            raw_html=mock_html,
            source_url=url,
        )
```

### MockEventEmitter (with test helpers)

```python
@register_event_emitter("mock")
class MockEventEmitter(ForEmittingEvents):
    """Mock emitter that captures events in memory."""

    def __init__(self) -> None:
        self._emitted_events: list[WorkflowEvent] = []

    async def emit(self, event: WorkflowEvent) -> None:
        """Store event for later inspection."""
        self._emitted_events.append(event)

    # TEST HELPERS

    @property
    def emitted_events(self) -> list[WorkflowEvent]:
        """Access all emitted events."""
        return self._emitted_events

    def get_events_for_workflow(self, workflow_id: str) -> list[WorkflowEvent]:
        """Filter events by workflow ID."""
        return [e for e in self._emitted_events if e.workflow_id == workflow_id]

    def get_events_by_type(self, event_type: str) -> list[WorkflowEvent]:
        """Filter events by type key."""
        return [e for e in self._emitted_events if e.type_key == event_type]

    def clear(self) -> None:
        """Clear stored events for test isolation."""
        self._emitted_events.clear()
```

### MockLLMAnalyzer (with dynamic responses)

```python
@register_llm_analyzer("mock")
class MockLLMAnalyzer(ForAnalyzingWithLLM):
    """Mock LLM that returns different responses based on prompt."""

    def __init__(self) -> None:
        self.call_count = 0
        self.last_prompt: str | None = None
        self.last_content: str | None = None
        self._custom_response: str | None = None  # For dynamic configuration

    async def analyze(self, prompt: str, content: str) -> LLMAnalysisResult:
        # Track calls for assertions
        self.call_count += 1
        self.last_prompt = prompt
        self.last_content = content

        # Return custom response if set
        if self._custom_response:
            return LLMAnalysisResult(text=self._custom_response)

        # Dynamic response based on prompt content
        if "Purpose Specialist" in prompt:
            return LLMAnalysisResult(text="## Purpose\nThis is a mock purpose analysis.")
        elif "Synthesis" in prompt:
            return LLMAnalysisResult(text="## Synthesis\nThis is a mock synthesis.")
        else:
            return LLMAnalysisResult(text="Mock analysis result.")

    # TEST HELPER: Set custom response
    def set_response(self, response: str) -> None:
        """Configure a specific response for testing."""
        self._custom_response = response

    def reset(self) -> None:
        """Reset state for test isolation."""
        self.call_count = 0
        self.last_prompt = None
        self.last_content = None
        self._custom_response = None
```

### InMemoryContentPersistence

```python
@register_content_persistence("inmemory")
class InMemoryContentPersistence(ForPersistingContent):
    """In-memory persistence for testing (no database required)."""

    def __init__(self):
        self._articles: dict[UUID, ContentItem] = {}
        self._sources: dict[str, UUID] = {}  # URL -> article ID

    async def save_article_with_source(
        self,
        content: ScrapedContent,
        bibtex: dict,
    ) -> UUID:
        article = WebArticle.create(
            title=bibtex.get("title", content.title),
            raw_html=content.raw_html,
            markdown=content.markdown,
            source_url=content.source_url,
        )
        self._articles[article.id] = article
        self._sources[content.source_url] = article.id
        return article.id

    async def find_by_id(self, content_id: UUID) -> ContentItem | None:
        return self._articles.get(content_id)

    async def find_by_source_url(self, url: str) -> ContentItem | None:
        article_id = self._sources.get(url)
        return self._articles.get(article_id) if article_id else None

    async def list_all(self) -> list[ContentItem]:
        return list(self._articles.values())

    # TEST HELPERS

    def clear(self) -> None:
        """Clear all stored data for test isolation."""
        self._articles.clear()
        self._sources.clear()

    @property
    def article_count(self) -> int:
        """Get count of stored articles."""
        return len(self._articles)
```

---

## Writing Tests with Mocks

### Test Setup with conftest.py

```python
# tests/conftest.py

import pytest
from infrastructure.configurators import TestConfigurator

@pytest.fixture(scope="session", autouse=True)
def initialize_test_dependencies():
    """Initialize DI container with TEST adapters for all tests.

    - Runs once per test session
    - Uses TestConfigurator (all mocks)
    - No API keys needed
    """
    configurator = TestConfigurator()
    configurator.configure_and_initialize()
    yield
```

### Override Configurator for Specific Config

```python
# tests/integration/test_late_chunking_embedder.py

import os
import pytest
from config.settings import get_settings
from infrastructure.configurators import TestConfigurator

@pytest.fixture(scope="module", autouse=True)
def initialize_dependencies():
    """Use TestConfigurator with e2e environment config.

    Loads: config/base.toml -> config/e2e.toml -> config/local.toml
    """
    # Clear cached settings and set environment
    get_settings.cache_clear()
    os.environ["APP_ENV"] = "e2e"

    configurator = TestConfigurator()
    configurator.configure_and_initialize()
    yield

    # Reset for other tests
    get_settings.cache_clear()
```

### Basic Activity Test

```python
@pytest.mark.asyncio
async def test_scrape_content_uses_mock(activity_env):
    """Test activity uses mock scraper from DI container."""
    result = await activity_env.run(scrape_content_activity, "https://example.com")

    assert isinstance(result, dict)
    assert result["title"] == "Mock Article Title"
    assert result["source_url"] == "https://example.com"
```

### Testing with MockEventEmitter

```python
@pytest.mark.asyncio
async def test_workflow_emits_events():
    """Test workflow emits expected events."""
    deps = get_current_dependencies()
    mock_emitter = deps.event_emitter  # MockEventEmitter
    mock_emitter.clear()  # Ensure clean state

    # Run workflow/activity
    await some_activity_that_emits_events("wf-123")

    # Assert events were emitted
    events = mock_emitter.get_events_for_workflow("wf-123")
    assert len(events) == 3

    started_events = mock_emitter.get_events_by_type("workflow.started")
    assert len(started_events) == 1

    completed_events = mock_emitter.get_events_by_type("workflow.completed")
    assert len(completed_events) == 1
```

### Testing with InMemoryPersistence

```python
@pytest.mark.asyncio
async def test_save_and_retrieve_article():
    """Test saving and retrieving via in-memory persistence."""
    deps = get_current_dependencies()
    persistence = deps.content_persistence  # InMemoryContentPersistence

    # Save article
    content = ScrapedContent(title="Test", source_url="https://test.com", ...)
    article_id = await persistence.save_article_with_source(content, {"title": "Test"})

    # Retrieve and verify
    retrieved = await persistence.find_by_id(article_id)
    assert retrieved is not None
    assert retrieved.title == "Test"

    # List all
    all_articles = await persistence.list_all()
    assert len(all_articles) == 1
```

---

## Dynamic Mock Configuration

### Pattern 1: Set Response Before Test

```python
@pytest.mark.asyncio
async def test_llm_returns_custom_response():
    """Test with custom LLM response."""
    deps = get_current_dependencies()
    mock_llm = deps.llm_analyzer  # MockLLMAnalyzer

    # Configure custom response
    mock_llm.set_response("Custom analysis for this specific test")

    # Run code that uses LLM
    result = await some_service.analyze_content("test content")

    # Assert custom response was used
    assert "Custom analysis" in result.text

    # Reset for other tests
    mock_llm.reset()
```

### Pattern 2: Verify Calls Were Made

```python
@pytest.mark.asyncio
async def test_llm_called_with_correct_prompt():
    """Verify LLM was called with expected parameters."""
    deps = get_current_dependencies()
    mock_llm = deps.llm_analyzer
    mock_llm.reset()

    # Run code
    await analyze_content_service.execute("document text here")

    # Verify calls
    assert mock_llm.call_count == 1
    assert "document text here" in mock_llm.last_content
    assert "analyze" in mock_llm.last_prompt.lower()
```

### Pattern 3: unittest.mock Integration

```python
from unittest.mock import patch, MagicMock

def test_with_patched_settings():
    """Test configurator with mocked settings."""
    mock_settings = MagicMock()
    mock_settings.adapters.content_scraper = "mock"
    mock_settings.adapters.bibtex_extractor = "mock"
    mock_settings.adapters.content_persistence = "inmemory"
    mock_settings.adapters.event_emitters = ["mock"]

    with patch("infrastructure.configurators.worker.get_settings", return_value=mock_settings):
        configurator = WorkerConfigurator()
        deps = configurator.configure()

    assert "Mock" in type(deps.content_scraper).__name__
```

### Pattern 4: Create Test-Specific Mock

```python
class CustomMockScraper(ForScrapingContent):
    """Custom mock for specific test scenario."""

    def __init__(self, responses: dict[str, ScrapedContent]):
        self.responses = responses  # URL -> response mapping
        self.calls: list[str] = []

    async def scrape(self, url: str) -> ScrapedContent:
        self.calls.append(url)
        if url in self.responses:
            return self.responses[url]
        raise ValueError(f"No mock response for {url}")

@pytest.mark.asyncio
async def test_with_custom_mock():
    """Test with URL-specific responses."""
    custom_scraper = CustomMockScraper({
        "https://news.com/article1": ScrapedContent(title="Article 1", ...),
        "https://news.com/article2": ScrapedContent(title="Article 2", ...),
    })

    # Manually inject into dependencies
    deps = ApplicationDependencies(
        content_scraper=custom_scraper,
        # ... other mocks ...
    )
    set_current_dependencies(deps)

    # Run test
    result1 = await scrape_content_activity("https://news.com/article1")
    result2 = await scrape_content_activity("https://news.com/article2")

    assert result1["title"] == "Article 1"
    assert result2["title"] == "Article 2"
    assert custom_scraper.calls == [
        "https://news.com/article1",
        "https://news.com/article2",
    ]
```

---

## Quick Reference

### Files to Know

| File | Purpose |
|------|---------|
| `src/application/dependencies.py` | DI container definition |
| `src/application/ports/driving/for_configuring.py` | Configurator port interface |
| `src/infrastructure/configurators/testing.py` | TestConfigurator (mocks) |
| `src/infrastructure/configurators/worker.py` | WorkerConfigurator (real) |
| `src/infrastructure/configurators/api.py` | APIConfigurator (real) |
| `src/infrastructure/adapter_registry.py` | Self-registering factory |
| `tests/conftest.py` | Test setup fixture |

### Available Mock Adapters

| Mock | Registry Key | Purpose |
|------|-------------|---------|
| `MockContentScraper` | `"mock"` | Canned HTML responses |
| `MockBibtexExtractor` | `"mock"` | Canned BibTeX data |
| `MockArticleExtractor` | `"mock"` | Canned article extraction |
| `MockMarkdownConverter` | `"mock"` | Simple markdown conversion |
| `MockEventEmitter` | `"mock"` | In-memory event capture |
| `MockLLMAnalyzer` | `"mock"` | Dynamic LLM responses |
| `MockStandardsExtractor` | `"mock"` | Canned standards |
| `MockUserContextProvider` | `"mock"` | Fixed user context |
| `InMemoryContentPersistence` | `"inmemory"` | Dict-based storage |
| `InMemoryAnalysisPersistence` | `"inmemory"` | Dict-based analysis storage |
| `MockEmbedder` | `"mock"` | Random embeddings |
| `MockHierarchyEmbedder` | `"mock"` | Random hierarchy embeddings |
| `MockEmbeddingIndexer` | `"mock"` | In-memory indexing |
| `MockFileStorageAdapter` | `"mock"` | In-memory file storage |

### Config Environments

Set `APP_ENV` to load different configurations:

| Environment | Config Files Loaded |
|-------------|---------------------|
| `development` | base.toml -> development.toml -> local.toml |
| `e2e` | base.toml -> e2e.toml -> local.toml |
| `docker` | base.toml -> docker.toml -> local.toml |
| `production` | base.toml -> production.toml -> local.toml |

### Test Fixture Pattern

```python
# Override integration conftest with mocks
@pytest.fixture(scope="module", autouse=True)
def initialize_dependencies():
    import os
    from config.settings import get_settings
    from infrastructure.configurators import TestConfigurator

    get_settings.cache_clear()
    os.environ["APP_ENV"] = "e2e"  # Or any environment

    configurator = TestConfigurator()
    configurator.configure_and_initialize()
    yield

    get_settings.cache_clear()
```

---

## Summary

The Configurator Pattern with DI enables:

1. **Testability** - Swap real adapters for mocks without code changes
2. **Flexibility** - Configure different adapters for different environments
3. **Isolation** - Tests don't depend on external services
4. **Speed** - In-memory mocks are fast
5. **Determinism** - Mocks return predictable responses

The key insight is that **application code depends on ports (abstractions)**, and the **configurator wires the appropriate adapter**. Tests use `TestConfigurator` with mocks, while production uses `WorkerConfigurator` or `APIConfigurator` with real adapters.
