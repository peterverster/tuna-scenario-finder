# Architecture Patterns Reference

Comprehensive reference for architectural patterns used in specifications and implementation plans.

---

## How to Use This Document

1. **Identify your architecture** from `CLAUDE.md` or project documentation
2. **Copy the relevant sections** into your specification's Structural Perspective
3. **Adapt to your feature** - not all components apply to every feature
4. **Be specific** - replace placeholders with actual component names

---

## Hexagonal Architecture (Ports & Adapters)

**The primary pattern for this project.** Based on Alistair Cockburn's original design.

### Core Principles

1. **Application at the center** - Pure business logic, no framework dependencies
2. **Ports define contracts** - Abstract interfaces for what app needs/provides
3. **Adapters implement ports** - Concrete implementations for specific technologies
4. **Dependencies point inward** - Infrastructure depends on Application, never reverse

### Port Classification (Cockburn)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│    DRIVING (PRIMARY)                           DRIVEN (SECONDARY)            │
│    Provided Interfaces                         Required Interfaces           │
│    "What the app OFFERS"                       "What the app NEEDS"          │
│                                                                              │
│    ┌────────────────────┐                     ┌────────────────────┐        │
│    │ For Using          │                     │ For Persisting     │        │
│    │ (main use cases)   │                     │ (repositories)     │        │
│    └────────────────────┘                     └────────────────────┘        │
│                              ┌───────────┐                                   │
│    ┌────────────────────┐    │           │    ┌────────────────────┐        │
│    │ For Admining       │───▶│    APP    │───▶│ For Emitting       │        │
│    │ (admin operations) │    │           │    │ (events, notifs)   │        │
│    └────────────────────┘    └───────────┘    └────────────────────┘        │
│                                                                              │
│    ┌────────────────────┐                     ┌────────────────────┐        │
│    │ For Configuring    │                     │ For Scraping       │        │
│    │ (setup, wiring)    │                     │ (external APIs)    │        │
│    └────────────────────┘                     └────────────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Port Naming Convention

**Driving Ports** (app provides these):
- Pattern: `For[Verb]ing` or `For[Verb]ing[Noun]`
- Examples: `ForConfiguring`, `ForProcessingDocuments`, `ForAdmining`

**Driven Ports** (app requires these):
- Pattern: `For[Verb]ing[Noun]`
- Examples: `ForPersistingContent`, `ForEmittingEvents`, `ForScrapingContent`

### Directory Structure

```
src/
├── domain/                          # Pure business logic (ZERO infra imports)
│   ├── entities/                    # Objects with identity and lifecycle
│   ├── value_objects/               # Immutable, identity-less concepts
│   ├── services/                    # Complex domain logic
│   └── events/                      # Domain events (polymorphic)
│
├── application/                     # Orchestration + Port interfaces
│   ├── ports/
│   │   ├── driving/                 # PROVIDED interfaces (app offers)
│   │   │   ├── for_configuring.py
│   │   │   └── for_processing_documents.py
│   │   └── driven/                  # REQUIRED interfaces (app needs)
│   │       ├── for_persisting_content.py    # Repository port
│   │       ├── for_emitting_events.py       # Event streaming port
│   │       ├── for_scraping_content.py      # Web scraping port
│   │       ├── for_generating_text.py       # LLM completion port
│   │       ├── for_extracting_metadata.py   # LLM extraction port
│   │       ├── for_embedding_text.py        # Embedding model port
│   │       ├── for_searching_content.py     # Search index port
│   │       └── for_resolving_user_context.py # Auth/user context port
│   ├── dependencies.py              # ApplicationDependencies container
│   ├── dto/                         # Data transfer objects
│   │   ├── requests/                # Input DTOs (API → Application)
│   │   └── responses/               # Output DTOs (Application → API)
│   ├── use_cases/                   # Synchronous business operations
│   ├── activities/                  # Temporal activities (async steps)
│   └── workflows/                   # Temporal workflows (async orchestration)
│
├── infrastructure/                  # Adapters (concrete implementations)
│   ├── adapters/
│   │   ├── driving/                 # Adapters for driving ports
│   │   │   └── api/                 # FastAPI routes
│   │   └── driven/                  # Adapters for driven ports
│   │       ├── persistence/         # Repository implementations
│   │       │   ├── postgres_repository.py
│   │       │   └── inmemory_repository.py
│   │       ├── events/              # Event emitter implementations
│   │       │   ├── ably_emitter.py
│   │       │   ├── structlog_emitter.py
│   │       │   └── mock_emitter.py
│   │       ├── scraping/            # Web scraper implementations
│   │       │   ├── scrapingbee_adapter.py
│   │       │   └── mock_scraper.py
│   │       ├── llm/                 # LLM provider implementations
│   │       │   ├── anthropic_adapter.py    # Claude API
│   │       │   ├── openai_adapter.py       # GPT-4 API
│   │       │   ├── pydantic_ai_adapter.py  # Pydantic-AI wrapper
│   │       │   └── mock_llm.py
│   │       ├── embeddings/          # Embedding model implementations
│   │       │   ├── huggingface_adapter.py  # HuggingFace Inference
│   │       │   ├── openai_embeddings.py    # text-embedding-3
│   │       │   └── mock_embeddings.py
│   │       ├── search/              # Search index implementations
│   │       │   ├── elasticsearch_adapter.py
│   │       │   └── mock_search.py
│   │       └── external_apis/       # Specialist external APIs
│   │           ├── temporal_client.py      # Temporal workflow client
│   │           ├── ably_client.py          # Ably pub/sub
│   │           └── s3_storage.py           # AWS S3 storage
│   ├── configurators/               # Implements ForConfiguring
│   │   ├── worker.py
│   │   ├── api.py
│   │   └── testing.py
│   └── adapter_registry.py          # Self-registration registry
│
└── entrypoints/                     # Composition roots
    ├── api/
    ├── worker/
    └── cli/
```

### Structural Section Template

```markdown
### Domain Layer

**Entities** (objects with identity and lifecycle):

| Entity | Purpose | Key Attributes | Invariants |
|--------|---------|----------------|------------|
| [Name] | [Purpose] | [Attributes] | [Rules that must hold] |

**Value Objects** (immutable, identity-less):

| Value Object | Purpose | Validation |
|--------------|---------|------------|
| [Name] | [What it represents] | [Validation rules] |

**Domain Services** (complex business logic):

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| [Name] | [What it does] | [Other domain objects] |

**Domain Events** (state changes - polymorphic):

| Event Class | type_key | Fields | Terminal? |
|-------------|----------|--------|-----------|
| [Name]Event | "[category].[action]" | [Fields] | Yes/No |

---

### Application Layer

**Driving Ports** (provided interfaces):

| Port | Purpose | Methods |
|------|---------|---------|
| For[Verb]ing | [What app offers] | [Method signatures] |

**Driven Ports** (required interfaces):

| Port | Purpose | Methods |
|------|---------|---------|
| For[Verb]ing[Noun] | [What app needs] | [Method signatures] |

**Use Cases**:

| Use Case | Purpose | Input | Output |
|----------|---------|-------|--------|
| [Name] | [What workflow] | [DTO/params] | [Result type] |

**ApplicationDependencies**:

| Dependency | Port Type | Purpose |
|------------|-----------|---------|
| content_scraper | ForScrapingContent | Web scraping |
| event_emitter | ForEmittingEvents | Event streaming |
| content_persistence | ForPersistingContent | Data storage |
| text_generator | ForGeneratingText | LLM completions |
| metadata_extractor | ForExtractingMetadata | Structured extraction |
| embedder | ForEmbeddingText | Vector embeddings |
| search_index | ForSearchingContent | Semantic search |
| user_context_provider | ForResolvingUserContext | Auth/identity |

---

### Infrastructure Layer

**Configurators** (implement ForConfiguring):

| Configurator | Context | Adapter Selection |
|--------------|---------|-------------------|
| WorkerConfigurator | Temporal worker | Production adapters |
| APIConfigurator | FastAPI server | Production adapters |
| TestConfigurator | pytest | Mock adapters |

**Adapter Registry**:

| Registry | Port | Registered Adapters |
|----------|------|---------------------|
| CONTENT_SCRAPER_REGISTRY | ForScrapingContent | scrapingbee, mock |
| EVENT_EMITTER_REGISTRY | ForEmittingEvents | ably, structlog, mock |
| PERSISTENCE_REGISTRY | ForPersistingContent | postgres, inmemory |
| TEXT_GENERATOR_REGISTRY | ForGeneratingText | anthropic, openai, pydantic-ai, mock |
| METADATA_EXTRACTOR_REGISTRY | ForExtractingMetadata | pydantic-ai, mock |
| EMBEDDING_REGISTRY | ForEmbeddingText | huggingface, openai, mock |
| SEARCH_REGISTRY | ForSearchingContent | elasticsearch, mock |
| USER_CONTEXT_REGISTRY | ForResolvingUserContext | clerk, mock |

**Adapters**:

| Adapter | Implements | Technology | Registry Key |
|---------|------------|------------|--------------|
| ScrapingBeeAdapter | ForScrapingContent | ScrapingBee API | "scrapingbee" |
| AblyEventEmitter | ForEmittingEvents | Ably pub/sub | "ably" |
| StructlogEmitter | ForEmittingEvents | Structlog | "structlog" |
| PostgresRepository | ForPersistingContent | PostgreSQL | "postgres" |
| AnthropicAdapter | ForGeneratingText | Claude API | "anthropic" |
| OpenAIAdapter | ForGeneratingText | GPT-4 API | "openai" |
| PydanticAIExtractor | ForExtractingMetadata | Pydantic-AI | "pydantic-ai" |
| HuggingFaceEmbeddings | ForEmbeddingText | HF Inference API | "huggingface" |
| OpenAIEmbeddings | ForEmbeddingText | text-embedding-3 | "openai" |
| ElasticsearchAdapter | ForSearchingContent | Elasticsearch | "elasticsearch" |
| ClerkUserProvider | ForResolvingUserContext | Clerk Auth | "clerk" |
```

---

## Configurator Port Pattern

**Cockburn's pattern for wiring dependencies.** The Configurator is a *driving* port.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│                  (Pure - No Infrastructure)                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ForConfiguring (driving port)                         │    │
│  │                                                         │    │
│  │  @abstractmethod                                        │    │
│  │  def configure() -> ApplicationDependencies             │    │
│  └────────────────────────────────────────────────────────┘    │
│                            │                                    │
│                            ▼                                    │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  ApplicationDependencies (frozen dataclass)            │    │
│  │                                                         │    │
│  │  content_scraper: ForScrapingContent                   │    │
│  │  event_emitter: ForEmittingEvents                      │    │
│  │  content_persistence: ForPersistingContent             │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ implements
┌─────────────────────────────────────────────────────────────────┐
│                   INFRASTRUCTURE LAYER                           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  WorkerConfigurator                                    │    │
│  │                                                         │    │
│  │  def configure():                                       │    │
│  │      settings = get_settings()                          │    │
│  │      scraper = registry.get(settings.adapters.scraper)  │    │
│  │      emitter = registry.get(settings.adapters.emitter)  │    │
│  │      return ApplicationDependencies(...)                │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Port Interface

```python
# application/ports/driving/for_configuring.py
class ForConfiguring(ABC):
    """Driving port for application configuration.

    Entry points (worker, API, tests) use this to wire dependencies.
    """

    @abstractmethod
    def configure(self) -> ApplicationDependencies:
        """Wire and return application dependencies."""
        pass

    @abstractmethod
    def configure_and_initialize(self) -> None:
        """Configure and set as current dependencies."""
        pass
```

### Dependencies Container

```python
# application/dependencies.py
@dataclass(frozen=True)
class ApplicationDependencies:
    """Container for injected dependencies.

    Application layer accesses adapters through this container.
    All fields are port types (abstractions), never concrete adapters.
    """
    content_scraper: ForScrapingContent
    event_emitter: ForEmittingEvents
    content_persistence: ForPersistingContent
    user_context_provider: ForResolvingUserContext


# Global access for activities
_dependencies: ApplicationDependencies | None = None

def get_current_dependencies() -> ApplicationDependencies:
    if _dependencies is None:
        raise RuntimeError("Dependencies not initialized")
    return _dependencies

def set_current_dependencies(deps: ApplicationDependencies) -> None:
    global _dependencies
    _dependencies = deps
```

### Configurator Implementations

```python
# infrastructure/configurators/worker.py
class WorkerConfigurator(ForConfiguring):
    """Production configuration for Temporal worker."""

    def configure(self) -> ApplicationDependencies:
        settings = get_settings()

        # Registry pattern: lookup by name from settings
        scraper = get_content_scraper(settings.adapters.content_scraper)
        emitter = get_event_emitter(settings.adapters.event_emitter)
        persistence = get_persistence(settings.adapters.content_persistence)

        return ApplicationDependencies(
            content_scraper=scraper,
            event_emitter=emitter,
            content_persistence=persistence,
        )

    def configure_and_initialize(self) -> None:
        deps = self.configure()
        set_current_dependencies(deps)
```

---

## Temporal Workflows vs Use Cases

**Choosing between synchronous use cases and durable workflow orchestration.**

### When to Use Each

| Aspect | Use Cases (Synchronous) | Temporal Workflows (Asynchronous) |
|--------|-------------------------|-----------------------------------|
| **Duration** | Milliseconds to seconds | Seconds to days/weeks |
| **Failure handling** | Try/catch, manual retry | Automatic retry, replay from checkpoint |
| **State** | In-memory, lost on crash | Durable, survives crashes |
| **Transactions** | Database transactions | Saga pattern across services |
| **External calls** | Direct HTTP/DB calls | Via activities with retry policies |
| **Complexity** | Simple request/response | Multi-step, long-running processes |

### Use Cases (Synchronous)

For simple, fast operations that complete within a single request:

```python
# application/use_cases/get_article.py
class GetArticleUseCase:
    """Synchronous use case - simple query operation."""

    def __init__(self, persistence: ForPersistingContent):
        self._persistence = persistence

    async def execute(self, article_id: str) -> ArticleResponse:
        article = await self._persistence.get_article(article_id)
        if not article:
            raise ArticleNotFoundError(article_id)
        return ArticleResponse.from_entity(article)
```

**Good for**:
- CRUD operations
- Simple queries
- Validation-only operations
- Operations that must be atomic

### Temporal Workflows (Asynchronous)

For complex, long-running operations that need durability:

```python
# application/workflows/ingestion_workflow.py
@workflow.defn
class IngestionWorkflow:
    """Durable workflow - survives crashes, retries automatically."""

    @workflow.run
    async def run(self, request: IngestionRequest) -> IngestionResult:
        # Each activity is a checkpoint - workflow replays from here on failure
        scraped = await workflow.execute_activity(
            scrape_content,
            request.url,
            start_to_close_timeout=timedelta(minutes=5),
        )

        extracted = await workflow.execute_activity(
            extract_metadata,
            scraped,
            start_to_close_timeout=timedelta(minutes=2),
        )

        await workflow.execute_activity(
            persist_article,
            extracted,
            start_to_close_timeout=timedelta(seconds=30),
        )

        return IngestionResult(article_id=extracted.id)
```

**Good for**:
- Multi-step pipelines (scrape → extract → persist)
- Operations with external API calls that may fail
- Long-running processes (batch jobs, data migrations)
- Operations requiring compensation on failure (saga pattern)

### Activities: The Bridge to Ports

Activities are where workflows interact with the outside world via ports:

```python
# application/activities/scrape_activity.py
@activity.defn
async def scrape_content(url: str) -> ScrapedContent:
    """Activity accesses ports via dependencies."""
    deps = get_current_dependencies()

    # Emit event (fire-and-forget)
    deps.event_emitter.emit(ActivityStartedEvent(
        workflow_id=activity.info().workflow_id,
        activity_name="scrape_content",
    ))

    # Use driven port
    result = await deps.content_scraper.scrape(url)

    deps.event_emitter.emit(ActivityCompletedEvent(
        workflow_id=activity.info().workflow_id,
        activity_name="scrape_content",
    ))

    return result
```

### Key Rules

1. **Workflows are deterministic** - No I/O, no ports, no randomness, no current time
2. **Activities have side effects** - All port access happens in activities
3. **Activities are idempotent** - May be retried; design for replay safety
4. **Workflows orchestrate** - They're the "brain" that sequences activities
5. **Activities execute** - They're the "hands" that do work

### Directory Structure

```
application/
├── use_cases/                   # Synchronous operations
│   ├── get_article.py          # Simple query
│   ├── validate_url.py         # Validation only
│   └── update_preferences.py   # Simple CRUD
├── workflows/                   # Temporal workflows (async orchestration)
│   ├── ingestion_workflow.py   # Scrape → Extract → Persist
│   ├── analysis_workflow.py    # Analyze → Score → Notify
│   └── batch_workflow.py       # Process many items
└── activities/                  # Temporal activities (async steps)
    ├── scrape_activity.py      # Web scraping
    ├── extract_activity.py     # Metadata extraction
    ├── persist_activity.py     # Database operations
    └── notify_activity.py      # Send notifications
```

---

## Event-Driven Async Workflow Architecture

**Coordinating UI, API, and Workers across separate processes via Pub/Sub events.**

This pattern combines several architectural concepts:
- **Event-Driven Architecture (EDA)** - Components communicate via events
- **CQRS** - Commands and queries flow through separate paths
- **Async Request-Reply** - Client receives acknowledgment, then results via separate channel
- **Saga Pattern** - Long-running transactions with Temporal workflows

### Process Separation

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SEPARATE PROCESSES                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────────┐    │
│  │              │     │              │     │                              │    │
│  │   Frontend   │     │     API      │     │   Temporal Worker            │    │
│  │   (Next.js)  │     │   (FastAPI)  │     │   (Workflows + Activities)   │    │
│  │              │     │              │     │                              │    │
│  └──────┬───────┘     └──────┬───────┘     └──────────────┬───────────────┘    │
│         │                    │                            │                     │
│         │  HTTP/REST         │  Start Workflow            │                     │
│         │───────────────────▶│────────────────────────────▶                     │
│         │                    │                            │                     │
│         │  202 Accepted      │                            │  Execute            │
│         │◀───────────────────│                            │  Activities         │
│         │  (workflow_id)     │                            │                     │
│         │                    │                            │                     │
└─────────┼────────────────────┼────────────────────────────┼─────────────────────┘
          │                    │                            │
          │                    │                            │
┌─────────┼────────────────────┼────────────────────────────┼─────────────────────┐
│         │              PUB/SUB (Ably)                     │                     │
│         │                    │                            │                     │
│         │◀───────────────────┼────────────────────────────│                     │
│         │     Subscribe      │         Publish Events     │                     │
│         │   workflow.{id}    │      (via ForEmittingEvents)                     │
│         │                    │                            │                     │
└─────────┴────────────────────┴────────────────────────────┴─────────────────────┘
```

### The Three Communication Paths

| Path | Direction | Mechanism | Purpose |
|------|-----------|-----------|---------|
| **Command** | UI → API → Worker | HTTP + Temporal Client | Initiate operations |
| **Acknowledgment** | API → UI | HTTP Response (202) | Confirm receipt, return workflow_id |
| **State Updates** | Worker → UI | Pub/Sub Events | Real-time progress and results |

### Command Path (Initiating Work)

```python
# infrastructure/adapters/driving/api/ingestion_router.py
@router.post("/ingest", status_code=202)
async def start_ingestion(request: IngestionRequest) -> WorkflowStartedResponse:
    """Start async workflow - returns immediately with workflow_id."""
    workflow_id = f"ingest-{uuid4()}"

    # Start workflow (non-blocking)
    await temporal_client.start_workflow(
        IngestionWorkflow.run,
        request,
        id=workflow_id,
        task_queue="ingestion-queue",
    )

    # Return immediately - client subscribes to events for updates
    return WorkflowStartedResponse(
        workflow_id=workflow_id,
        status="accepted",
        subscribe_channel=f"workflow.{workflow_id}",
    )
```

### Event Path (State Propagation)

Activities emit events via the `ForEmittingEvents` port:

```python
# application/activities/scrape_activity.py
@activity.defn
async def scrape_content(url: str) -> ScrapedContent:
    deps = get_current_dependencies()
    workflow_id = activity.info().workflow_id

    # Emit start event → Pub/Sub → Frontend
    await deps.event_emitter.emit(ActivityStartedEvent(
        workflow_id=workflow_id,
        activity_name="scrape_content",
        message="Fetching content from URL...",
    ))

    try:
        result = await deps.content_scraper.scrape(url)

        await deps.event_emitter.emit(ActivityCompletedEvent(
            workflow_id=workflow_id,
            activity_name="scrape_content",
            message=f"Scraped {len(result.html)} bytes",
        ))

        return result

    except Exception as e:
        await deps.event_emitter.emit(ActivityFailedEvent(
            workflow_id=workflow_id,
            activity_name="scrape_content",
            error_message=str(e),
        ))
        raise
```

### Frontend Event Subscription

```typescript
// Frontend: Subscribe to workflow events
const useWorkflowEvents = (workflowId: string) => {
  const [state, setState] = useState<WorkflowState>({ status: 'pending' });

  useEffect(() => {
    const channel = ably.channels.get(`workflow.${workflowId}`);

    channel.subscribe((message) => {
      const event = message.data as WorkflowEvent;

      // Event-driven state transitions
      switch (event.type_key) {
        case 'workflow.started':
          setState({ status: 'running', progress: 0 });
          break;
        case 'activity.started':
          setState(prev => ({ ...prev, currentActivity: event.activity_name }));
          break;
        case 'activity.completed':
          setState(prev => ({ ...prev, progress: prev.progress + 25 }));
          break;
        case 'workflow.completed':
          setState({ status: 'completed', result: event.result });
          // Fetch final state from API
          fetchFinalResult(workflowId);
          break;
        case 'workflow.failed':
          setState({ status: 'failed', error: event.error_message });
          break;
      }
    });

    return () => channel.unsubscribe();
  }, [workflowId]);

  return state;
};
```

### Callback Pattern (Fetching Final State)

When workflow completes, frontend calls back to API for authoritative state:

```typescript
// Frontend: Fetch final result after completion event
const fetchFinalResult = async (workflowId: string) => {
  // Events signal completion, API provides authoritative data
  const response = await fetch(`/api/workflows/${workflowId}/result`);
  const result = await response.json();
  setFinalResult(result);
};
```

```python
# API: Provide authoritative workflow result
@router.get("/workflows/{workflow_id}/result")
async def get_workflow_result(workflow_id: str) -> WorkflowResultResponse:
    """Fetch final workflow result from database."""
    # Query persisted result (set by workflow's final activity)
    result = await persistence.get_workflow_result(workflow_id)
    return WorkflowResultResponse.from_entity(result)
```

### Event Types for State Transitions

| Event | UI Transition | Action |
|-------|---------------|--------|
| `workflow.started` | idle → running | Show progress indicator |
| `activity.started` | Update current step | Show activity name |
| `activity.progress` | Update progress bar | Show percentage |
| `activity.completed` | Increment progress | Move to next step |
| `activity.failed` | Show error state | Display retry option |
| `workflow.completed` | running → completed | Fetch final result from API |
| `workflow.failed` | running → failed | Display error message |

### The ForEmittingEvents Port

```python
# application/ports/driven/for_emitting_events.py
class ForEmittingEvents(ABC):
    """Port for emitting workflow events to external systems."""

    @abstractmethod
    async def emit(self, event: WorkflowEvent) -> None:
        """Emit event to subscribers."""
        pass
```

### Composite Emitter (Multiple Destinations)

Events can flow to multiple destinations simultaneously:

```python
# infrastructure/adapters/driven/events/composite_emitter.py
class CompositeEventEmitter(ForEmittingEvents):
    """Emit to multiple destinations: Ably (real-time) + Structlog (audit)."""

    def __init__(self, emitters: list[ForEmittingEvents]):
        self._emitters = emitters

    async def emit(self, event: WorkflowEvent) -> None:
        for emitter in self._emitters:
            try:
                await emitter.emit(event)
            except Exception as e:
                # Log but continue - don't fail workflow for event emission
                logger.warning(f"Event emission failed: {e}")
```

### Configuration

```toml
# config/production.toml
[adapters]
event_emitters = ["ably", "structlog"]  # Real-time + audit log

# config/development.toml
[adapters]
event_emitters = ["structlog"]  # Local dev: just logging

# config/testing.toml
[adapters]
event_emitters = ["mock"]  # Tests: capture for assertions
```

### Key Principles

1. **Fire-and-Forget Events** - Workflows continue even if event emission fails
2. **Events for Progress, API for Data** - Events signal state changes; API provides authoritative data
3. **Workflow ID Correlation** - All events share `workflow_id` for UI thread correlation
4. **Idempotent Event Handling** - Frontend handles duplicate/out-of-order events gracefully
5. **Graceful Degradation** - If Pub/Sub fails, UI can poll API as fallback

### Related Patterns

- **CQRS** - Commands via API, Queries via events + API callback
- **Event Sourcing** - Events represent state changes (though not stored as source of truth)
- **Saga Pattern** - Temporal workflows with compensation
- **Backend for Frontend (BFF)** - API tailored for frontend needs

---

## Self-Registering Adapter Registry

**Pattern for adding adapters without modifying existing code.**

### Registry Structure

```python
# infrastructure/adapter_registry.py
from typing import Callable, TypeVar

T = TypeVar("T")

# Registries for each port type
CONTENT_SCRAPER_REGISTRY: dict[str, type] = {}
EVENT_EMITTER_REGISTRY: dict[str, type] = {}
PERSISTENCE_REGISTRY: dict[str, type] = {}


def register_content_scraper(name: str) -> Callable[[type[T]], type[T]]:
    """Decorator to register content scraper adapter."""
    def decorator(cls: type[T]) -> type[T]:
        CONTENT_SCRAPER_REGISTRY[name] = cls
        return cls
    return decorator


def get_content_scraper(name: str) -> ForScrapingContent:
    """Get scraper instance by registry name."""
    if name not in CONTENT_SCRAPER_REGISTRY:
        available = ", ".join(CONTENT_SCRAPER_REGISTRY.keys())
        raise ValueError(f"Unknown scraper: '{name}'. Available: {available}")
    return CONTENT_SCRAPER_REGISTRY[name]()
```

### Self-Registering Adapter

```python
# infrastructure/adapters/driven/scraping/scrapingbee_adapter.py
from infrastructure.adapter_registry import register_content_scraper

@register_content_scraper("scrapingbee")
class ScrapingBeeAdapter(ForScrapingContent):
    """ScrapingBee implementation of content scraper port."""

    def __init__(self):
        settings = get_settings()
        self._api_key = settings.secrets.scraping_bee_api_key

    async def scrape(self, url: str) -> ScrapedContent:
        # Implementation using ScrapingBee API
        pass
```

### Adding New Adapters

1. Create adapter with `@register_*` decorator
2. Add setting option to `settings.adapters.*`
3. Configure in `config/local.toml`
4. Restart - automatically available

**No changes needed to**:
- ApplicationDependencies
- Configurators
- Activities or workflows

---

## TOML Configuration Management

**Layered configuration with secrets separation.**

### Configuration Layers

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

### File Structure

```
config/
├── base.toml               # Foundation defaults (committed)
├── development.toml        # Development overrides (committed)
├── production.toml         # Production overrides (committed)
├── local.toml.example      # Template for local config (committed)
└── local.toml              # YOUR machine settings (git-ignored)

src/config/
├── __init__.py             # Exports: Settings, get_settings
├── loader.py               # TOML loading with deep merge
├── secrets.py              # Environment-only secrets (Pydantic)
└── settings.py             # Typed Settings class

.envrc                      # Secrets via direnv (git-ignored)
```

### Configuration Sections

```toml
# config/base.toml

[app]
name = "Application"
environment = "development"
log_level = "INFO"

[database]
pool_size = 5
max_overflow = 10

[database.connection]
driver = "postgresql+asyncpg"
host = "localhost"
port = 5432
name = "app_dev"
user = "postgres"
# password: NEVER HERE - use POSTGRES_PASSWORD env var

[adapters]
content_scraper = "scrapingbee"        # scrapingbee | mock
event_emitters = ["ably", "structlog"] # List for composite
content_persistence = "postgres"       # postgres | inmemory
text_generator = "anthropic"           # anthropic | openai | pydantic-ai | mock
metadata_extractor = "pydantic-ai"     # pydantic-ai | mock
embedder = "huggingface"               # huggingface | openai | mock
search_index = "elasticsearch"         # elasticsearch | mock
user_context_provider = "mock"         # clerk | mock

[features]
enable_feature_x = true
enable_feature_y = false
```

### Secrets (Environment Only)

```python
# config/secrets.py
class Secrets(BaseSettings):
    """Secret values - loaded ONLY from environment variables."""

    model_config = SettingsConfigDict(env_prefix="", extra="ignore")

    # Database
    postgres_password: SecretStr = Field(default=SecretStr(""), alias="POSTGRES_PASSWORD")

    # LLM Providers
    anthropic_api_key: SecretStr | None = Field(default=None, alias="ANTHROPIC_API_KEY")
    openai_api_key: SecretStr | None = Field(default=None, alias="OPENAI_API_KEY")
    pydantic_ai_api_key: SecretStr | None = Field(default=None, alias="PYDANTIC_AI_API_KEY")
    huggingface_api_key: SecretStr | None = Field(default=None, alias="HUGGINGFACE_API_KEY")

    # External Services
    scraping_bee_api_key: SecretStr | None = Field(default=None, alias="SCRAPINGBEE_API_KEY")
    ably_api_key: SecretStr | None = Field(default=None, alias="ABLY_API_KEY")
    temporal_api_key: SecretStr | None = Field(default=None, alias="TEMPORAL_API_KEY")
    elasticsearch_api_key: SecretStr | None = Field(default=None, alias="ELASTICSEARCH_API_KEY")

    # Security
    secret_key: SecretStr = Field(default=SecretStr("change-me"), alias="SECRET_KEY")
    jwt_secret_key: SecretStr = Field(default=SecretStr("change-me"), alias="JWT_SECRET_KEY")
```

### Settings Access

```python
from config import get_settings

settings = get_settings()

# Hierarchical access (ONLY supported pattern)
settings.database.pool_size
settings.database.connection.host
settings.adapters.content_scraper
settings.features.enable_feature_x

# Secrets via settings.secrets
api_key = settings.secrets.pydantic_ai_api_key
if api_key:
    key_value = api_key.get_secret_value()
```

---

## Polymorphic Event Pattern

**Self-registering event classes with type discriminator.**

### Why Not Enum?

- Enums can't encapsulate type-specific behavior
- Enums require external switch/match statements
- Polymorphism enables Open/Closed Principle
- Each event validates itself

### Event Registry

```python
# domain/events/base.py
EVENT_TYPE_REGISTRY: dict[str, type["WorkflowEvent"]] = {}


def register_event_type(cls: type["WorkflowEvent"]) -> type["WorkflowEvent"]:
    """Decorator to register event class by type_key."""
    if not hasattr(cls, "type_key"):
        raise ValueError(f"{cls.__name__} must define type_key")
    EVENT_TYPE_REGISTRY[cls.type_key] = cls
    return cls


def deserialize_event(data: dict) -> "WorkflowEvent":
    """Deserialize event using type discriminator."""
    type_key = data.get("type_key")
    event_class = EVENT_TYPE_REGISTRY[type_key]
    return event_class.from_dict(data)
```

### Base Event Class

```python
@dataclass(frozen=True)
class WorkflowEvent(ABC):
    """Abstract base for all workflow events.

    POLYMORPHIC PATTERN:
    - Each event type is a subclass with specific behavior
    - type_key acts as discriminator for serialization
    - Encapsulates validation per event type
    """

    workflow_id: str
    event_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: datetime = field(default_factory=lambda: datetime.now(UTC))
    message: str | None = None

    type_key: ClassVar[str]  # Discriminator - override in subclasses

    @property
    @abstractmethod
    def is_terminal(self) -> bool:
        """Does this event end the workflow/activity?"""
        pass

    @property
    @abstractmethod
    def is_failure(self) -> bool:
        """Does this event represent a failure?"""
        pass

    def to_dict(self) -> dict:
        return {
            "type_key": self.type_key,
            "workflow_id": self.workflow_id,
            "event_id": self.event_id,
            "timestamp": self.timestamp.isoformat(),
            "message": self.message,
        }
```

### Concrete Event Classes

```python
@register_event_type
@dataclass(frozen=True)
class ActivityStartedEvent(WorkflowEvent):
    """Activity has started execution."""

    type_key: ClassVar[str] = "activity.started"
    activity_name: str = ""

    @property
    def is_terminal(self) -> bool:
        return False

    @property
    def is_failure(self) -> bool:
        return False


@register_event_type
@dataclass(frozen=True)
class ActivityProgressEvent(WorkflowEvent):
    """Activity progress update."""

    type_key: ClassVar[str] = "activity.progress"
    progress_percent: int = 0

    def _validate(self) -> None:
        if not 0 <= self.progress_percent <= 100:
            raise ValueError("progress_percent must be 0-100")

    @property
    def is_terminal(self) -> bool:
        return False

    @property
    def is_failure(self) -> bool:
        return False


@register_event_type
@dataclass(frozen=True)
class ActivityFailedEvent(WorkflowEvent):
    """Activity failed with error."""

    type_key: ClassVar[str] = "activity.failed"
    error_message: str = ""
    error_code: str | None = None

    @property
    def is_terminal(self) -> bool:
        return True

    @property
    def is_failure(self) -> bool:
        return True
```

---

## Composite Adapter Pattern

**Multiple adapters active simultaneously for same port.**

### Use Case

Event emitters: emit to both Ably (real-time) AND Structlog (audit log)

### Implementation

```python
# infrastructure/adapters/driven/events/composite_emitter.py
class CompositeEventEmitter(ForEmittingEvents):
    """Delegates to multiple emitters."""

    def __init__(self, emitters: list[ForEmittingEvents]):
        self._emitters = emitters

    def emit(self, event: WorkflowEvent) -> None:
        for emitter in self._emitters:
            try:
                emitter.emit(event)
            except Exception as e:
                # Log but don't propagate - other emitters continue
                logger.error(f"Emitter failed: {e}")


# In configurator
def _create_event_emitter(self) -> ForEmittingEvents:
    settings = get_settings()
    emitter_names = settings.adapters.event_emitters  # ["ably", "structlog"]

    emitters = [get_event_emitter(name) for name in emitter_names]

    if len(emitters) == 1:
        return emitters[0]
    return CompositeEventEmitter(emitters)
```

### Configuration

```toml
# config/base.toml
[adapters]
event_emitters = ["ably", "structlog"]  # List for composite

# config/local.toml (testing)
[adapters]
event_emitters = ["mock"]  # Single mock for tests
```

---

## Testing Structure

**Organizing tests to validate each architectural layer independently.**

### Directory Structure

```
tests/
├── unit/                        # Fast, isolated tests (no external deps)
│   ├── domain/                  # Test business logic in isolation
│   │   ├── test_entities.py
│   │   ├── test_value_objects.py
│   │   └── test_domain_services.py
│   └── application/             # Test use cases/activities with mocked ports
│       ├── test_use_cases.py
│       └── test_activities.py
├── integration/                 # Test with real adapters
│   ├── adapters/                # Test adapter implementations
│   │   ├── test_postgres_repository.py
│   │   ├── test_elasticsearch_adapter.py
│   │   └── test_scrapingbee_adapter.py
│   └── workflows/               # Test workflows with test server
│       └── test_ingestion_workflow.py
├── e2e/                         # End-to-end system tests
│   ├── test_api_endpoints.py    # Full API flow tests
│   └── test_workflow_execution.py
├── fixtures/                    # Shared test data & factories
│   ├── factories.py             # Entity/DTO factories
│   └── sample_data.py           # Sample test data
└── conftest.py                  # Shared pytest fixtures
```

### Testing by Layer

| Layer | Test Type | Dependencies | Speed |
|-------|-----------|--------------|-------|
| Domain | Unit | None (pure logic) | Fastest |
| Application | Unit | Mock ports | Fast |
| Infrastructure | Integration | Real adapters, test DBs | Slower |
| System | E2E | Full stack | Slowest |

### Mock Adapters for Testing

Each driven port has a mock adapter for unit testing:

```python
# infrastructure/adapters/driven/scraping/mock_scraper.py
@register_content_scraper("mock")
class MockContentScraper(ForScrapingContent):
    """Mock scraper for testing."""

    def __init__(self):
        self.scrape_calls: list[str] = []
        self.response: ScrapedContent | None = None

    async def scrape(self, url: str) -> ScrapedContent:
        self.scrape_calls.append(url)
        if self.response:
            return self.response
        return ScrapedContent(url=url, html="<html>mock</html>")
```

### Test Configurator

```python
# infrastructure/configurators/testing.py
class TestConfigurator(ForConfiguring):
    """Test configuration with mock adapters."""

    def configure(self) -> ApplicationDependencies:
        return ApplicationDependencies(
            content_scraper=MockContentScraper(),
            event_emitter=MockEventEmitter(),
            content_persistence=InMemoryRepository(),
            user_context_provider=MockUserContextProvider(),
        )
```

### Example Test Structure

```python
# tests/unit/application/test_activities.py
class TestScrapeActivity:
    @pytest.fixture
    def mock_deps(self):
        """Configure mock dependencies."""
        configurator = TestConfigurator()
        configurator.configure_and_initialize()
        return get_current_dependencies()

    async def test_scrape_emits_events(self, mock_deps):
        """Activity should emit start and complete events."""
        await scrape_content("https://example.com")

        emitter = mock_deps.event_emitter
        assert len(emitter.emitted_events) == 2
        assert emitter.emitted_events[0].type_key == "activity.started"
        assert emitter.emitted_events[1].type_key == "activity.completed"
```

---

## Architecture Anti-Patterns

**Common violations that break hexagonal architecture.**

### Layer Violations

| Violation | Example | Fix |
|-----------|---------|-----|
| Domain imports infrastructure | `from sqlalchemy import Column` in entity | Use plain Python classes |
| Domain imports framework | `from fastapi import HTTPException` in service | Define domain exceptions |
| Application uses DB directly | `session.query(User)` in use case | Inject repository port |
| Missing port abstraction | Use case imports `PostgresRepository` directly | Import `ForPersistingContent` |

### Dependency Direction Violations

```
WRONG: Domain → Infrastructure
       Application ↔ Infrastructure (circular)

RIGHT: Infrastructure → Application → Domain
       (dependencies point inward only)
```

### Code Smells

**Domain layer importing anything external**:
```python
# BAD - domain/entities/article.py
from sqlalchemy.orm import relationship  # Framework leak!
from pydantic import BaseModel           # Framework leak!

# GOOD - domain/entities/article.py
from dataclasses import dataclass        # Standard library only
```

**Application layer with concrete adapters**:
```python
# BAD - application/activities/scrape_activity.py
from infrastructure.adapters.driven.scraping.scrapingbee_adapter import ScrapingBeeAdapter

scraper = ScrapingBeeAdapter()  # Concrete dependency!

# GOOD - application/activities/scrape_activity.py
deps = get_current_dependencies()
result = await deps.content_scraper.scrape(url)  # Via port abstraction
```

**Workflow with I/O operations**:
```python
# BAD - application/workflows/ingestion_workflow.py
@workflow.run
async def run(self, request):
    # WRONG: Workflows must be deterministic!
    response = await httpx.get(request.url)  # I/O in workflow!
    current_time = datetime.now()            # Non-deterministic!

# GOOD - application/workflows/ingestion_workflow.py
@workflow.run
async def run(self, request):
    # All I/O happens in activities
    result = await workflow.execute_activity(scrape_content, request.url)
```

### Checklist Before Commit

- [ ] Domain layer has zero infrastructure imports
- [ ] Application layer only imports ports (abstractions), not adapters
- [ ] Workflows have no I/O, no `datetime.now()`, no random calls
- [ ] Activities access ports via `get_current_dependencies()`
- [ ] New adapters are registered via `@register_*` decorators
- [ ] Tests use `TestConfigurator` with mock adapters

---

## Data Transfer Objects (DTOs)

**Objects for crossing layer boundaries.**

### Why DTOs?

- **Decouple layers** - Domain entities don't leak to API responses
- **Control serialization** - DTOs define exactly what's exposed
- **Validate input** - Request DTOs validate before reaching domain
- **Version API independently** - Change DTOs without changing domain

### DTO Location

```
application/
└── dto/
    ├── requests/                # Inbound data (API → Application)
    │   ├── ingestion_request.py
    │   └── search_request.py
    └── responses/               # Outbound data (Application → API)
        ├── article_response.py
        └── search_results_response.py
```

### Request DTOs (Inbound)

```python
# application/dto/requests/ingestion_request.py
from pydantic import BaseModel, HttpUrl

class IngestionRequest(BaseModel):
    """Request to ingest a URL."""

    url: HttpUrl
    source_name: str | None = None
    priority: int = 0

    class Config:
        frozen = True
```

### Response DTOs (Outbound)

```python
# application/dto/responses/article_response.py
from pydantic import BaseModel
from domain.entities.article import Article

class ArticleResponse(BaseModel):
    """Article data for API response."""

    id: str
    title: str
    url: str
    published_at: datetime | None
    summary: str | None

    @classmethod
    def from_entity(cls, article: Article) -> "ArticleResponse":
        """Convert domain entity to response DTO."""
        return cls(
            id=str(article.id),
            title=article.title,
            url=str(article.url),
            published_at=article.published_at,
            summary=article.summary,
        )
```

### Boundary Crossing Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   FastAPI   │    │  Request    │    │   Domain    │    │  Response   │
│   Router    │───▶│    DTO      │───▶│   Entity    │───▶│    DTO      │
│             │    │             │    │             │    │             │
│ (Infra)     │    │ (App)       │    │ (Domain)    │    │ (App)       │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       │   Validates &    │   Pure business  │   Serializes &   │
       │   deserializes   │   logic only     │   hides internals│
       ▼                  ▼                  ▼                  ▼
   JSON Request    Typed Python obj   Domain model      JSON Response
```

### Rules

1. **API routes receive Request DTOs** - Never raw dicts or domain entities
2. **API routes return Response DTOs** - Never domain entities directly
3. **Use cases accept/return DTOs** - Bridge between API and domain
4. **Domain entities stay in domain** - Converted at boundaries
5. **DTOs are immutable** - Use `frozen=True` or `@dataclass(frozen=True)`

---

## Clean Architecture

**Alternative to Hexagonal - concentric circles with dependencies pointing inward.**

### Structure

```
src/
├── entities/              # Enterprise business rules (center)
├── use_cases/             # Application business rules
├── interface_adapters/    # Controllers, presenters, gateways
└── frameworks_drivers/    # Web, database, external interfaces
```

### Template

```markdown
### Entities (Enterprise Business Rules)

| Entity | Purpose | Business Rules |
|--------|---------|----------------|
| [Name] | [Core concept] | [Critical rules] |

### Use Cases (Application Business Rules)

| Use Case | Input | Output | Business Rule |
|----------|-------|--------|---------------|
| [Name] | [Request] | [Response] | [Rule applied] |

### Interface Adapters

| Adapter | Type | Purpose |
|---------|------|---------|
| [Name]Controller | Controller | Handle requests |
| [Name]Presenter | Presenter | Format responses |
| [Name]Gateway | Gateway | Data access |

### Frameworks & Drivers

| Component | Technology | Purpose |
|-----------|------------|---------|
| Web | [Framework] | HTTP handling |
| Database | [DB] | Persistence |
```

---

## Layered Architecture

**Traditional horizontal layers with downward dependencies.**

### Structure

```
src/
├── presentation/    # UI, API controllers
├── business/        # Services, domain models
├── data/            # Repositories, database access
└── cross_cutting/   # Logging, security, validation
```

### Template

```markdown
### Presentation Layer

| Controller | Purpose | Endpoints |
|------------|---------|-----------|
| [Name] | [What it handles] | [Routes] |

### Business Logic Layer

| Service | Purpose | Dependencies |
|---------|---------|--------------|
| [Name] | [Business operation] | [Other services] |

### Data Access Layer

| Repository | Entity | Operations |
|------------|--------|------------|
| [Name] | [What it persists] | [CRUD + queries] |
```

---

## Choosing a Pattern

| If your project has... | Use... |
|------------------------|--------|
| Complex business logic + testability needs | Hexagonal (Ports & Adapters) |
| `_domain/` folder | Hexagonal with DDD |
| Multiple deployment contexts (worker, API, CLI) | Configurator Port Pattern |
| Need to swap adapters via config | Self-Registering Registry |
| TOML config files | Layered TOML Configuration |
| Event streaming | Polymorphic Event Pattern |
| Multiple outputs for same action | Composite Adapter Pattern |
| Simple CRUD | Layered Architecture |
| Traditional web app | MVC |

---

## Related Documents

- `_docs/configuration-guide.md` - Full configuration guide
- `_docs/configurator-port-pattern-guide.md` - Detailed configurator pattern
- `_docs/port-naming-conventions.md` - Port naming conventions
- `_docs/toml-configuration-management.md` - TOML migration guide
- `_docs/blueprint-convention.md` - Coding Agents Development Flow (Checks and Balances)

