# Testing Strategy - BlackSwans.ai

**Version**: 1.0.0
**Last Updated**: 2025-12-14
**Target Coverage**: 100% (aspirational), 95% minimum (enforced)
**Philosophy**: Test-Driven Development (TDD) + Behavior-Driven Development (BDD)

---

## Table of Contents

1. [Overview & Principles](#1-overview--principles)
2. [Test Pyramid & Layer Strategy](#2-test-pyramid--layer-strategy)
3. [Configurator Pattern for Test Isolation](#3-configurator-pattern-for-test-isolation)
4. [TDD/BDD Workflow](#4-tddbdd-workflow)
5. [Testing by Architecture Layer](#5-testing-by-architecture-layer)
6. [Coverage Strategy (100% Target)](#6-coverage-strategy-100-target)
7. [Test Organization & Naming](#7-test-organization--naming)
8. [Fixtures & Test Data](#8-fixtures--test-data)
9. [Quality Gates & CI/CD](#9-quality-gates--cicd)
10. [Common Patterns & Examples](#10-common-patterns--examples)

---

## 1. Overview & Principles

### 1.1 Testing Philosophy

BlackSwans.ai follows **Test-Driven Development (TDD)** combined with **Behavior-Driven Development (BDD)** to ensure:

1. **Design Quality** - Tests drive clean interfaces (write tests first)
2. **Behavioral Clarity** - Tests document expected behavior (living documentation)
3. **Regression Prevention** - Tests catch breaking changes immediately
4. **Refactoring Confidence** - Change implementation without breaking tests
5. **100% Coverage Goal** - Every line, branch, and edge case tested

### 1.2 Core Principles

**Principle 1: Configurator Pattern Enables Clean Test Isolation**
- ✅ Unit tests use `TestConfigurator` (all mocks, zero external dependencies)
- ✅ Integration tests use `WorkerConfigurator` (real adapters)
- ✅ E2E tests use full stack (API + Worker + Database + Temporal)
- ✅ Single fixture change switches entire test suite's dependency wiring

**Principle 2: Test the Contract, Not the Implementation**
- ✅ Domain tests: Pure business logic (no mocks needed)
- ✅ Application tests: Test against port interfaces (mock adapters)
- ✅ Infrastructure tests: Test adapter compliance with port contract
- ✅ Never test internal implementation details (private methods)

**Principle 3: Fast Feedback Loop (TDD Cycle)**
```
RED → GREEN → REFACTOR → REPEAT
 ↓      ↓         ↓
Write  Make it   Clean up
Test   Pass      Code
```

**Principle 4: Tests Are First-Class Code**
- ✅ Same quality standards as production (black, ruff, mypy)
- ✅ Clear naming: `test_<behavior>_<context>_<expected_outcome>`
- ✅ AAA pattern: Arrange, Act, Assert
- ✅ One assertion per test (ideal), focused on single behavior

**Principle 5: Test Independence**
- ✅ Each test runs in isolation (no shared state)
- ✅ Tests can run in any order (no dependencies)
- ✅ Clean setup/teardown via fixtures
- ✅ Mock emitter stores events per-test (no cross-contamination)

---

## 2. Test Pyramid & Layer Strategy

### 2.1 Test Pyramid (Optimized for Fast Feedback)

```
                    /\
                   /  \
                  / E2E \              ~5% (10-20 tests)
                 /--------\            Slow (minutes)
                /          \           Full system
               / Integration \         ~15% (50-100 tests)
              /--------------\         Medium (seconds)
             /                \        Real adapters
            /   Unit Tests     \       ~80% (300-500 tests)
           /--------------------\      Fast (milliseconds)
          /  Domain, Application \     Mocked dependencies
         /________________________\
```

**Target Distribution**:
- **80% Unit Tests** - Domain entities, value objects, use cases (with mocked ports)
- **15% Integration Tests** - Adapter implementations (real Ably, real database, real Temporal)
- **5% E2E Tests** - Complete workflows (API → Worker → Ably → Frontend)

**Why This Distribution?**
- Fast feedback: Most tests run in <1 second (unit tests)
- Comprehensive coverage: Unit tests catch 80% of bugs
- Confidence: Integration/E2E tests verify real-world behavior
- Cost-effective: Minimize expensive external API calls

### 2.2 Test Markers (pytest)

Use markers to categorize and run specific test suites:

```python
@pytest.mark.unit          # Fast, mocked, no external deps (DEFAULT)
@pytest.mark.integration   # Real adapters, may call APIs
@pytest.mark.e2e           # Full system, slowest
@pytest.mark.fitness       # Architecture fitness functions
```

**Run Strategies**:
```bash
# Fast feedback loop (TDD) - Unit tests only
pytest -m unit                    # ~1 second, 300+ tests

# Pre-commit - Unit + Integration
pytest -m "unit or integration"   # ~10 seconds, 400+ tests

# Pre-push - All tests except E2E
pytest -m "not e2e"               # ~30 seconds, 450+ tests

# CI/CD - Everything
pytest                            # ~2 minutes, 500+ tests
```

---

## 3. Configurator Pattern for Test Isolation

### 3.1 The Power of TestConfigurator

**Key Insight**: BlackSwans.ai's Configurator Port Pattern enables **entire test suite mocking with ONE fixture**.

**How It Works**:

```python
# tests/conftest.py (global - applies to ALL tests)

@pytest.fixture(scope="session", autouse=True)
def initialize_test_dependencies():
    """Initialize DI container with mock adapters.

    PATTERN: TestConfigurator wires ALL mocks
    - MockContentScraper (no ScrapingBee API calls)
    - MockBibtexExtractor (no Claude API calls)
    - InMemoryContentPersistence (no PostgreSQL)
    - MockEmitter (no Ably API calls) [NEW]
    - MockAuthProvider (no Clerk API calls) [NEW]

    RESULT: Unit tests have ZERO external dependencies
    """
    configurator = TestConfigurator()
    configurator.configure_and_initialize()
    yield
```

**All 300+ unit tests automatically use mocks** - no per-test mocking required!

### 3.2 TestConfigurator Implementation

**Current Implementation** (from `src/infrastructure/configurators/testing.py`):

```python
class TestConfigurator(ForConfiguring):
    """Wires ALL mock adapters for testing."""

    def configure(self) -> ApplicationDependencies:
        # Force mock adapters (ignore .env settings)
        content_scraper = get_content_scraper("mock")
        bibtex_extractor = get_bibtex_extractor("mock")
        content_persistence = get_content_persistence("inmemory")

        # NEW: Event streaming mocks
        event_emitter = get_event_emitter("mock")
        auth_provider = get_auth_provider("mock")

        return ApplicationDependencies(
            content_scraper=content_scraper,
            bibtex_extractor=bibtex_extractor,
            content_persistence=content_persistence,
            event_emitter=event_emitter,     # NEW
            auth_provider=auth_provider,     # NEW
        )
```

**Benefits**:
- ✅ Single source of truth for test dependencies
- ✅ Add new adapter? Just wire mock in TestConfigurator
- ✅ All tests automatically use mocks (no boilerplate)
- ✅ Integration tests override with `WorkerConfigurator` in their conftest

### 3.3 Integration Test Override

**Pattern**: Integration tests have their own `conftest.py` that uses **real adapters**.

```python
# tests/integration/conftest.py

import pytest
from infrastructure.configurators import WorkerConfigurator

@pytest.fixture(scope="session", autouse=True)
def initialize_dependencies():
    """Override global fixture - use REAL adapters for integration tests."""
    configurator = WorkerConfigurator()  # Real ScrapingBee, real Ably, real DB
    configurator.configure_and_initialize()
    yield
```

**Scoping**:
- `tests/conftest.py` applies to ALL tests (session-scoped, autouse)
- `tests/integration/conftest.py` **overrides** for integration directory
- `tests/unit/` uses global conftest (mocks)
- `tests/integration/` uses local conftest (real adapters)

**Result**: Clear separation, no manual mocking in test code!

---

## 4. TDD/BDD Workflow

### 4.1 Test-Driven Development (TDD) Cycle

**RED → GREEN → REFACTOR** for every feature:

**Step 1: RED (Write Failing Test)**
```python
# tests/unit/domain/entities/test_workflow_event.py

def test_workflow_event_requires_workflow_id():
    """Test WorkflowEvent validates workflow_id is required."""
    # Arrange: Invalid event without workflow_id
    # Act & Assert: Should raise ValueError
    with pytest.raises(ValueError, match="workflow_id is required"):
        WorkflowEvent(workflow_id="", event_type=EventType.WORKFLOW_STARTED)
```

**Run test**: `pytest tests/unit/domain/entities/test_workflow_event.py::test_workflow_event_requires_workflow_id`
- ❌ **FAILS** (WorkflowEvent doesn't exist yet)

**Step 2: GREEN (Minimal Implementation)**
```python
# src/domain/events/workflow_event.py

@dataclass
class WorkflowEvent:
    workflow_id: str
    event_type: EventType

    def __post_init__(self):
        if not self.workflow_id:
            raise ValueError("workflow_id is required")
```

**Run test**: `pytest tests/unit/domain/entities/test_workflow_event.py::test_workflow_event_requires_workflow_id`
- ✅ **PASSES**

**Step 3: REFACTOR (Clean Up)**
- Add docstrings, type hints
- Extract magic strings to constants
- Follow SOLID principles

**Run test again**: ✅ Still passes

**Repeat** for next test (progress_percent validation, etc.)

### 4.2 Behavior-Driven Development (BDD) Approach

**Use Gherkin-style test names** to document behavior:

```python
class TestScraperContentActivity:
    """Given-When-Then style test suite."""

    def test_given_valid_url_when_scrape_then_returns_scraped_content(self):
        """Test successful scraping with valid URL."""
        # Given
        url = "https://example.com/article"

        # When
        result = await scrape_content_activity(url)

        # Then
        assert isinstance(result, ScrapedContent)
        assert result.source_url == url

    def test_given_invalid_url_when_scrape_then_raises_validation_error(self):
        """Test scraping fails with invalid URL."""
        # Given
        url = "not-a-url"

        # When/Then
        with pytest.raises(ValueError):
            await scrape_content_activity(url)
```

**BDD Test Structure**:
1. **Given** (Arrange) - Set up preconditions
2. **When** (Act) - Execute the behavior under test
3. **Then** (Assert) - Verify expected outcome

### 4.3 TDD Development Sequence

**For New Feature** (e.g., Workflow Streaming Events):

**Day 1: Domain Entities (Pure TDD)**
1. Write test: `test_user_context_requires_user_id()` → RED
2. Implement: `UserContext.__post_init__` validation → GREEN
3. Refactor: Add docstrings → GREEN
4. Write test: `test_user_context_channel_namespace_org_scoped()` → RED
5. Implement: `channel_namespace()` method → GREEN
6. Refactor: Extract format strings → GREEN
7. **Repeat** for WorkflowEvent, ChannelName

**Day 2: Port Interfaces**
1. Write test: `test_event_emitter_port_is_abstract()` → Verify ABC
2. Define: `ForEmittingEvents` abstract base class → GREEN
3. Write test: `test_emit_method_signature()` → Verify signature
4. **Repeat** for ForAuthenticatingUsers

**Day 3-4: Adapters (Integration TDD)**
1. Write test: `test_ably_emitter_publishes_to_channel()` → RED (AblyEmitter doesn't exist)
2. Implement: `AblyEmitter.emit()` → GREEN
3. Write test: `test_ably_emitter_handles_connection_failure()` → RED
4. Implement: Exception handling in `emit()` → GREEN
5. **Repeat** for ClerkAuthProvider

**Day 5: Application Layer (BDD)**
1. Write test: `test_given_user_triggers_ingestion_when_workflow_runs_then_emits_started_event()` → RED
2. Implement: Event emission in workflow → GREEN
3. Write test: `test_given_activity_fails_when_emitting_then_workflow_continues()` → RED
4. Implement: Fire-and-forget pattern → GREEN

**Result**: Feature implemented with 100% coverage (tests written first!)

---

## 5. Testing by Architecture Layer

### 5.1 Domain Layer Tests (Pure, No Mocks)

**What to Test**:
- Entity creation and factory methods
- Invariant enforcement (validation in `__post_init__`)
- State transitions and lifecycle methods
- Value object immutability
- Business rule enforcement

**What NOT to Test**:
- Serialization to JSON (that's infrastructure concern)
- Database persistence (that's infrastructure concern)
- External API calls (domain is pure Python)

**Testing Pattern**:
```python
# tests/unit/domain/entities/test_user_context.py

import pytest
from domain.entities.user_context import UserContext
from domain.value_objects.channel_name import ChannelName

class TestUserContext:
    """Test UserContext entity - PURE domain logic."""

    def test_create_with_org_id(self):
        """Test creating UserContext with organisation."""
        # Arrange & Act
        ctx = UserContext(
            user_id="user_123",
            org_id="org_abc",
            email="user@example.com",
        )

        # Assert - Invariants
        assert ctx.user_id == "user_123"
        assert ctx.org_id == "org_abc"

    def test_requires_user_id(self):
        """Test user_id is required (invariant)."""
        with pytest.raises(ValueError, match="user_id is required"):
            UserContext(user_id="")  # Invalid

    def test_channel_namespace_org_scoped(self):
        """Test channel namespace for org-scoped context."""
        ctx = UserContext(user_id="user_123", org_id="org_abc")

        namespace = ctx.channel_namespace()

        assert namespace == "org:org_abc"

    def test_channel_namespace_user_scoped_fallback(self):
        """Test channel namespace falls back to user if no org."""
        ctx = UserContext(user_id="user_123")  # No org_id

        namespace = ctx.channel_namespace()

        assert namespace == "user:user_123"

    def test_workflow_channel_returns_channel_name(self):
        """Test workflow_channel creates ChannelName VO."""
        ctx = UserContext(user_id="user_123", org_id="org_abc")

        channel = ctx.workflow_channel("wf_456")

        assert isinstance(channel, ChannelName)
        assert str(channel) == "org:org_abc:workflow:wf_456"

    def test_schema_conversion_roundtrip(self):
        """Test to_schema and from_schema are inverses."""
        original = UserContext(user_id="user_123", org_id="org_abc")

        schema = original.to_schema()
        reconstructed = UserContext.from_schema(schema)

        assert reconstructed.user_id == original.user_id
        assert reconstructed.org_id == original.org_id
```

**Coverage Target**: 100% for domain entities (they're pure logic)

**Why No Mocks?**
- Domain entities have NO external dependencies
- Tests verify business logic only
- Fast (thousands of tests run in seconds)
- No flaky tests (deterministic, pure functions)

---

### 5.2 Application Layer Tests (With Mocked Ports)

**What to Test**:
- Activities use correct ports from DI container
- Workflows orchestrate activities in correct order
- Use cases coordinate domain operations
- Error handling and retry logic
- UserContext propagation through layers

**What NOT to Test**:
- How adapters work internally (that's infrastructure concern)
- Database queries (mock the persistence port)
- External API calls (mock the scraper port)

**Testing Pattern** (Leverages TestConfigurator):

```python
# tests/unit/application/activities/test_ingestion_activities.py

import pytest
from application.activities.ingestion_activities import scrape_content_activity
from application.dependencies import get_current_dependencies
from application.ports.driven import ScrapedContent

@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_activity_uses_injected_scraper():
    """Test activity uses scraper from DI container (mocked by TestConfigurator).

    PATTERN: Configurator-Driven Mocking
    - Global conftest wires TestConfigurator (mocks)
    - Activity calls get_current_dependencies()
    - Activity gets MockContentScraper automatically
    - NO manual mocking needed in test!
    """
    # Arrange: Nothing! TestConfigurator already wired mocks

    # Act
    result = await scrape_content_activity("https://example.com")

    # Assert
    assert isinstance(result, ScrapedContent)
    assert result.title == "Mock Article Title"  # From MockContentScraper
    assert result.source_url == "https://example.com"

@pytest.mark.unit
@pytest.mark.asyncio
async def test_scrape_activity_emits_started_event():
    """Test activity emits STARTED event via EventEmitter port.

    PATTERN: Verify Port Usage
    - Activity should call deps.event_emitter.emit()
    - MockEmitter (from TestConfigurator) stores events
    - Assert event was emitted with correct data
    """
    # Arrange
    deps = get_current_dependencies()
    mock_emitter = deps.event_emitter  # MockEmitter from TestConfigurator
    mock_emitter.clear()  # Clean slate

    # Act
    await scrape_content_activity("https://example.com")

    # Assert
    events = mock_emitter.get_events_for_workflow("test-workflow")
    assert len(events) >= 1
    assert events[0].event_type == EventType.ACTIVITY_STARTED
    assert events[0].activity_name == "scrape_content"
    assert "Scraping" in events[0].message
```

**Coverage Target**: 95-100% for application layer

**Key Pattern**: Tests verify **port usage**, not adapter implementation

---

### 5.3 Infrastructure Layer Tests (Adapter Contract Compliance)

**What to Test**:
- Adapter implements port interface correctly
- Error handling (network failures, invalid responses)
- Configuration from settings (Pydantic Settings)
- Serialization/deserialization (domain ↔ external format)
- Retry logic and timeouts

**What NOT to Test**:
- External service behavior (Ably API internals, Clerk API internals)
- Framework internals (FastAPI routing, Pydantic validation)

**Testing Pattern** (Mock External SDKs):

```python
# tests/unit/infrastructure/adapters/event_emitters/test_ably_emitter.py

import pytest
from unittest.mock import MagicMock, patch
from infrastructure.adapters.event_emitters.ably_emitter import AblyEmitter
from domain.events.workflow_event import WorkflowEvent
from domain.events.event_types import EventType
from domain.entities.user_context import UserContext

class TestAblyEmitter:
    """Test AblyEmitter adapter - Mock Ably SDK."""

    @patch("infrastructure.adapters.event_emitters.ably_emitter.AblyRest")
    def test_emit_publishes_to_correct_channel(self, mock_ably_class):
        """Test emitter publishes to org-scoped channel."""
        # Arrange: Mock Ably SDK
        mock_client = MagicMock()
        mock_channel = MagicMock()
        mock_ably_class.return_value = mock_client
        mock_client.channels.get.return_value = mock_channel

        emitter = AblyEmitter()
        event = WorkflowEvent(
            workflow_id="wf_123",
            event_type=EventType.ACTIVITY_STARTED,
        )
        user_ctx = UserContext(user_id="user_1", org_id="org_abc")

        # Act
        await emitter.emit(event, user_ctx)

        # Assert: Verify Ably SDK called correctly
        mock_client.channels.get.assert_called_once_with("org:org_abc:workflow:wf_123")
        mock_channel.publish.assert_called_once()

        # Verify payload
        call_args = mock_channel.publish.call_args
        assert call_args[0][0] == "workflow_event"  # Event name
        assert call_args[0][1]["workflow_id"] == "wf_123"  # Payload

    @patch("infrastructure.adapters.event_emitters.ably_emitter.AblyRest")
    def test_emit_handles_ably_failure_gracefully(self, mock_ably_class):
        """Test fire-and-forget: Ably failure doesn't raise exception."""
        # Arrange: Ably SDK raises exception
        mock_client = MagicMock()
        mock_ably_class.return_value = mock_client
        mock_client.channels.get.side_effect = Exception("Ably API down")

        emitter = AblyEmitter()
        event = WorkflowEvent(workflow_id="wf_123", event_type=EventType.ACTIVITY_STARTED)
        user_ctx = UserContext(user_id="user_1")

        # Act: Should NOT raise exception (fire-and-forget)
        await emitter.emit(event, user_ctx)  # No exception

        # Assert: Logged error but continued
        # (Verify via structlog testing or just ensure no exception)

    def test_initialization_requires_ably_api_key(self):
        """Test AblyEmitter fails fast if API key not configured."""
        # Arrange: Clear settings (simulate missing API key)
        with patch("infrastructure.adapters.event_emitters.ably_emitter.get_settings") as mock_settings:
            mock_settings.return_value.secrets.ably_api_key = None

            # Act & Assert
            with pytest.raises(ValueError, match="Ably API key not configured"):
                AblyEmitter()
```

**Coverage Target**: 95%+ for adapters (critical path + error handling)

**Why Mock External SDKs?**
- Fast tests (no network calls)
- No API costs (ScrapingBee, Claude, Ably are paid)
- Deterministic (no flaky tests from network issues)
- Test error handling (simulate API failures)

---

### 5.4 Integration Tests (Real Adapters, Real Services)

**When to Write Integration Tests**:
- ✅ Verify adapter works with **real** external service (Ably, Clerk, PostgreSQL)
- ✅ Test complex interactions (database transactions, Temporal workflows)
- ✅ Validate configuration (settings correctly wired)
- ✅ Catch integration bugs (mismatched API contracts)

**Testing Pattern**:

```python
# tests/integration/adapters/test_ably_emitter_integration.py

import pytest
from ably import AblyRest
from infrastructure.adapters.event_emitters.ably_emitter import AblyEmitter
from domain.events.workflow_event import WorkflowEvent
from domain.events.event_types import EventType
from domain.entities.user_context import UserContext
import asyncio

@pytest.mark.integration
@pytest.mark.asyncio
async def test_ably_emitter_publishes_to_real_channel(ably_test_client):
    """Test AblyEmitter with REAL Ably service.

    INTEGRATION TEST:
    - Uses real Ably account (test environment)
    - Publishes to ephemeral channel
    - Subscribes and verifies message received
    - Cleans up channel after test
    """
    # Arrange: Real Ably emitter (from WorkerConfigurator in integration conftest)
    emitter = AblyEmitter()

    # Create test event
    event = WorkflowEvent(
        workflow_id="integration-test-wf-123",
        event_type=EventType.ACTIVITY_STARTED,
        message="Integration test event",
    )
    user_ctx = UserContext(user_id="test_user", org_id="test_org")

    # Subscribe to channel to verify delivery
    channel_name = str(user_ctx.workflow_channel(event.workflow_id))
    channel = ably_test_client.channels.get(channel_name)

    received_events = []

    def on_message(message):
        received_events.append(message.data)

    channel.subscribe("workflow_event", on_message)

    # Act: Publish via emitter
    await emitter.emit(event, user_ctx)

    # Wait for message delivery (Ably is eventually consistent)
    await asyncio.sleep(0.5)

    # Assert: Message received
    assert len(received_events) == 1
    assert received_events[0]["workflow_id"] == "integration-test-wf-123"
    assert received_events[0]["event_type"] == "activity.started"

    # Cleanup
    channel.unsubscribe()

@pytest.fixture(scope="session")
def ably_test_client():
    """Provide real Ably client for integration tests.

    Uses ABLY_TEST_API_KEY from .env.test
    """
    from config import get_settings
    settings = get_settings()
    return AblyRest(settings.secrets.ably_api_key.get_secret_value())
```

**Coverage Target**: 80%+ for integration tests (focus on critical paths)

**Best Practices**:
- Use test accounts/environments (not production)
- Clean up resources after tests (delete channels, truncate tables)
- Use fixtures for external service clients
- Timeout tests (max 30 seconds per integration test)

---

### 5.5 End-to-End Tests (Full System)

**When to Write E2E Tests**:
- ✅ Critical user journeys (login → ingest → view progress → complete)
- ✅ Cross-service workflows (API → Temporal → Ably → Frontend)
- ✅ Smoke tests for deployment validation
- ⚠️ Minimize count (expensive, slow, flaky)

**Testing Pattern** (Playwright for Frontend E2E):

```python
# tests/e2e/test_workflow_streaming_e2e.py

import pytest
from playwright.async_api import async_playwright, Page

@pytest.mark.e2e
@pytest.mark.asyncio
async def test_content_ingestion_with_live_progress():
    """E2E: User submits URL and sees real-time progress updates.

    FULL SYSTEM TEST:
    - Real API (FastAPI)
    - Real Worker (Temporal)
    - Real Ably (pub/sub)
    - Real Frontend (React)

    Verifies: API → Workflow → Activity → Ably → Frontend → UI Update
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # 1. Navigate to app
        await page.goto("http://localhost:3000")

        # 2. Login (Clerk test user)
        await page.fill("[data-testid=email-input]", "test@example.com")
        await page.fill("[data-testid=password-input]", "test_password")
        await page.click("[data-testid=login-button]")
        await page.wait_for_url("**/dashboard")

        # 3. Navigate to ingest page
        await page.click("[data-testid=ingest-link]")

        # 4. Submit URL for ingestion
        await page.fill("[data-testid=url-input]", "https://arxiv.org/abs/2411.00001")
        await page.click("[data-testid=ingest-button]")

        # 5. Verify progress bar appears
        await page.wait_for_selector("[data-testid=progress-bar]", timeout=1000)

        # 6. Verify real-time updates
        # Initial state: 0% progress
        progress_bar = page.locator("[data-testid=progress-bar]")
        initial_value = await progress_bar.get_attribute("aria-valuenow")
        assert int(initial_value) == 0

        # Wait for first update (scraping started)
        await page.wait_for_function(
            "document.querySelector('[data-testid=progress-message]').textContent.includes('Scraping')",
            timeout=2000,
        )

        # Verify progress increased
        current_value = await progress_bar.get_attribute("aria-valuenow")
        assert int(current_value) > 0

        # Wait for completion (max 2 minutes for real workflow)
        await page.wait_for_function(
            "document.querySelector('[data-testid=progress-bar]').getAttribute('aria-valuenow') === '100'",
            timeout=120000,  # 2 minutes
        )

        # 7. Verify completion message
        message = await page.text_content("[data-testid=progress-message]")
        assert "complete" in message.lower()

        await browser.close()
```

**Coverage Target**: N/A (E2E tests don't contribute to code coverage metrics)

**Best Practices**:
- Limit to 5-10 critical user journeys
- Use `data-testid` attributes (not CSS selectors)
- Run in CI/CD on every PR (detect regressions)
- Parallelize with pytest-xdist if >10 tests

---

## 6. Coverage Strategy (100% Target)

### 6.1 Coverage Configuration

**Current Setup** (from `pyproject.toml`):
```toml
[tool.coverage.run]
source = ["src"]
omit = [
    "*/tests/*",
    "*/__pycache__/*",
    "*/migrations/*",
]

[tool.coverage.report]
precision = 2
show_missing = true
skip_covered = false
fail_under = 95.0  # Enforced minimum

[tool.coverage.html]
directory = "tests-output/coverage-html"

[tool.coverage.xml]
output = "tests-output/coverage.xml"

[tool.coverage.json]
output = "tests-output/coverage.json"
```

**Run Coverage**:
```bash
# Generate coverage report
pytest --cov=src --cov-report=html --cov-report=term-missing

# View HTML report
open tests-output/coverage-html/index.html

# Check coverage percentage
pytest --cov=src --cov-report=term | grep TOTAL
```

### 6.2 100% Coverage Roadmap

**Phase 1: Establish Baseline (Current: ~87%)**
- ✅ All domain entities: 100% coverage
- ✅ All value objects: 100% coverage
- ✅ All ports: 100% coverage (just ABCs, easy)
- ✅ All activities: 95%+ coverage
- ⚠️ Adapters: ~80% coverage (need error path tests)
- ⚠️ API endpoints: ~70% coverage (need edge case tests)

**Phase 2: Eliminate Gaps (Target: 95%)**
- Add error handling tests for all adapters
- Add edge case tests for API endpoints
- Add branch coverage for conditional logic
- Add exception handling tests

**Phase 3: Reach 100% (Aspirational)**
- Test every branch (if/else, try/except)
- Test every edge case (None, empty, max values)
- Test error messages (verify exact wording)
- Test __repr__, __str__ methods

### 6.3 Coverage by Layer (Targets)

| Layer | Target | Strategy |
|-------|--------|----------|
| **Domain** (Entities, VOs) | **100%** | Pure logic, no mocks, easy to test |
| **Application** (Activities, Workflows) | **100%** | Mock ports via TestConfigurator |
| **Ports** (Interfaces) | **100%** | Just ABCs, trivial to cover |
| **Adapters** (Infrastructure) | **95%** | Mock external SDKs, test error paths |
| **API** (FastAPI Endpoints) | **95%** | TestClient, mock Temporal |
| **Configurators** | **100%** | Simple wiring logic |
| **Overall** | **95% enforced, 100% goal** | Incremental improvement |

### 6.4 Uncovered Code Analysis

**Identify Untested Code**:
```bash
# Generate coverage with missing lines
pytest --cov=src --cov-report=term-missing

# Example output:
# src/domain/entities/user_context.py    87%   45-47, 52
#                                              ^^^^^^ These lines not covered

# View in HTML for easier navigation
pytest --cov=src --cov-report=html
open tests-output/coverage-html/index.html
# Red highlights = uncovered lines
```

**Common Uncovered Code** (and how to fix):

| Pattern | Example | How to Test |
|---------|---------|-------------|
| **Error handling** | `except Exception as e:` | Inject failing mock, assert exception caught |
| **Edge cases** | `if value is None:` | Test with None, empty, boundary values |
| **Defensive checks** | `if not self.field:` | Test with empty string, None |
| **Fallback logic** | `value or default` | Test with falsy values |
| **Repr/str** | `def __repr__(self):` | Simple assertion: `assert "UserContext" in repr(ctx)` |

---

## 7. Test Organization & Naming

### 7.1 Directory Structure (Mirrors src/)

**Mirror Production Code Structure**:

```
tests/
├── conftest.py                          # Global: TestConfigurator (mocks)
├── unit/                                # Fast, mocked dependencies
│   ├── conftest.py                      # Unit-specific fixtures (optional)
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── test_user_context.py
│   │   │   ├── test_content_item.py
│   │   │   └── test_content_source.py
│   │   ├── events/
│   │   │   ├── test_workflow_event.py
│   │   │   └── test_event_types.py
│   │   └── value_objects/
│   │       ├── test_channel_name.py
│   │       └── test_bibtex.py
│   ├── application/
│   │   ├── activities/
│   │   │   └── test_ingestion_activities.py
│   │   ├── workflows/
│   │   │   └── test_content_ingestion_workflow.py
│   │   └── utilities/
│   │       └── test_user_context_binding.py
│   └── infrastructure/
│       ├── adapters/
│       │   ├── event_emitters/
│       │   │   ├── test_ably_emitter.py
│       │   │   ├── test_mock_emitter.py
│       │   │   └── test_composite_emitter.py
│       │   ├── auth/
│       │   │   ├── test_clerk_auth_provider.py
│       │   │   └── test_mock_auth_provider.py
│       │   ├── test_scraping_bee.py
│       │   └── test_postgres_repo.py
│       ├── configurators/
│       │   └── test_configurators.py
│       └── http/
│           ├── test_content_api.py
│           └── test_auth_endpoints.py
├── integration/                         # Real adapters, external services
│   ├── conftest.py                      # WorkerConfigurator (real adapters)
│   ├── adapters/
│   │   ├── test_ably_emitter_integration.py
│   │   ├── test_clerk_auth_integration.py
│   │   └── test_postgres_repo_integration.py
│   └── workflows/
│       └── test_content_ingestion_integration.py
├── e2e/                                 # Full system, browser tests
│   ├── conftest.py                      # Playwright setup
│   └── test_workflow_streaming_e2e.py
└── fitness/                             # Architecture compliance tests
    ├── test_dependency_rules.py         # Verify Domain → Application → Infrastructure
    ├── test_no_magic_strings.py         # Grep for os.getenv()
    └── test_port_compliance.py          # All adapters implement ports
```

**Naming Rules**:
- **File**: `test_<module_name>.py` (matches source file)
- **Class**: `Test<ClassName>` or `Test<Behavior>` (groups related tests)
- **Method**: `test_<behavior>_<context>_<expected>` (descriptive)

**Examples**:
```python
# Good test names (describe behavior)
def test_user_context_requires_user_id()
def test_workflow_event_validates_progress_percent_range()
def test_ably_emitter_handles_connection_failure_gracefully()
def test_given_org_scoped_user_when_create_channel_then_uses_org_namespace()

# Bad test names (implementation-focused)
def test_user_context()  # Too vague
def test_init()  # What about init?
def test_1()  # No description
```

### 7.2 Test Class Organization

**Group Related Tests by Behavior**:

```python
class TestUserContextChannelNaming:
    """Test UserContext channel naming behavior."""

    def test_org_scoped_channel_uses_org_namespace(self):
        ...

    def test_user_scoped_channel_uses_user_namespace(self):
        ...

    def test_channel_name_includes_workflow_id(self):
        ...

class TestUserContextValidation:
    """Test UserContext validation rules."""

    def test_requires_user_id(self):
        ...

    def test_allows_missing_org_id(self):
        ...

    def test_rejects_invalid_user_id_format(self):
        ...
```

---

## 8. Fixtures & Test Data

### 8.1 Configurator-Based Fixtures (Primary Strategy)

**Global Fixture** (applies to ALL tests):

```python
# tests/conftest.py

import pytest
from infrastructure.configurators import TestConfigurator

@pytest.fixture(scope="session", autouse=True)
def initialize_test_dependencies():
    """Wire mocks via TestConfigurator - applies to ALL tests."""
    configurator = TestConfigurator()
    configurator.configure_and_initialize()
    yield
```

**No Per-Test Mocking Needed**:
```python
# Test activities WITHOUT manual mocking
async def test_scrape_activity():
    # TestConfigurator already wired MockContentScraper
    result = await scrape_content_activity("https://example.com")
    assert result.title == "Mock Article Title"  # From mock
```

**Access Mocks for Verification**:
```python
async def test_activity_emits_event():
    # Get mock from DI container
    deps = get_current_dependencies()
    mock_emitter = deps.event_emitter  # MockEmitter

    # Execute
    await scrape_content_activity("https://example.com")

    # Verify mock was called
    events = mock_emitter.get_events_for_workflow("test-wf")
    assert len(events) > 0
```

### 8.2 Domain Fixtures (Reusable Test Data)

**Create domain object factories**:

```python
# tests/fixtures/domain_factories.py

import pytest
from uuid import uuid4
from domain.entities.user_context import UserContext
from domain.events.workflow_event import WorkflowEvent
from domain.events.event_types import EventType
from domain.value_objects.channel_name import ChannelName

@pytest.fixture
def user_context_org_scoped() -> UserContext:
    """UserContext with organisation."""
    return UserContext(
        user_id="user_123",
        org_id="org_abc",
        email="test@example.com",
        name="Test User",
        org_name="Test Org",
    )

@pytest.fixture
def user_context_user_scoped() -> UserContext:
    """UserContext without organisation (user-scoped)."""
    return UserContext(
        user_id="user_123",
        email="test@example.com",
        name="Test User",
    )

@pytest.fixture
def workflow_event_started() -> WorkflowEvent:
    """WorkflowEvent for WORKFLOW_STARTED."""
    return WorkflowEvent(
        workflow_id="test-workflow-123",
        event_type=EventType.WORKFLOW_STARTED,
        progress_percent=0,
        message="Workflow started",
    )

@pytest.fixture
def workflow_event_completed() -> WorkflowEvent:
    """WorkflowEvent for WORKFLOW_COMPLETED."""
    return WorkflowEvent(
        workflow_id="test-workflow-123",
        event_type=EventType.WORKFLOW_COMPLETED,
        progress_percent=100,
        message="Workflow completed successfully",
    )

# Usage in tests
def test_workflow_event_is_terminal(workflow_event_completed):
    assert workflow_event_completed.is_terminal() is True
```

**Import fixtures in conftest**:
```python
# tests/conftest.py
pytest_plugins = ["tests.fixtures.domain_factories"]
```

### 8.3 Integration Test Fixtures (Real Services)

```python
# tests/integration/conftest.py

import pytest
from ably import AblyRest
from config import get_settings
from infrastructure.configurators import WorkerConfigurator

@pytest.fixture(scope="session", autouse=True)
def initialize_dependencies():
    """Override global - use REAL adapters."""
    configurator = WorkerConfigurator()
    configurator.configure_and_initialize()
    yield

@pytest.fixture(scope="session")
def ably_test_client() -> AblyRest:
    """Provide real Ably client for integration tests."""
    settings = get_settings()
    # Hierarchical access: settings.secrets.ably_api_key
    return AblyRest(settings.secrets.ably_api_key.get_secret_value())

@pytest.fixture
async def test_channel(ably_test_client):
    """Provide ephemeral test channel, cleanup after."""
    channel_name = f"test:channel:{uuid4()}"
    channel = ably_test_client.channels.get(channel_name)

    yield channel

    # Cleanup
    channel.detach()

@pytest.fixture(scope="session")
async def postgres_test_session():
    """Provide PostgreSQL session for integration tests."""
    from infrastructure.database.engine import get_engine
    from sqlalchemy.ext.asyncio import AsyncSession

    engine = get_engine()
    async with AsyncSession(engine) as session:
        yield session
```

---

## 9. Quality Gates & CI/CD

### 9.1 Pre-Commit Checks (Local Development)

**Run before every commit**:
```bash
# Quick check (unit tests only)
make test-unit

# Full check (all quality gates)
make quality
```

**Makefile Targets**:
```makefile
test-unit:
	PYTHONPATH=src pytest -m unit --cov=src --cov-report=term-missing

test-integration:
	PYTHONPATH=src pytest -m integration

test-all:
	PYTHONPATH=src pytest --cov=src --cov-report=html --cov-report=term-missing

quality:
	black src tests
	ruff check src tests
	mypy src
	bandit -r src
	pytest -m "unit or integration" --cov=src --cov-fail-under=95
```

### 9.2 CI/CD Pipeline (GitHub Actions)

**Recommended Workflow** (`.github/workflows/test.yml`):

```yaml
name: Test & Quality

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.13'
      - run: pip install -e ".[dev]"
      - run: pytest -m unit --cov=src --cov-report=xml
      - uses: codecov/codecov-action@v4
        with:
          file: ./tests-output/coverage.xml

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -e ".[dev]"
      - run: pytest -m integration
        env:
          ABLY_API_KEY: ${{ secrets.ABLY_TEST_API_KEY }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_TEST_SECRET_KEY }}

  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -e ".[dev]"
      - run: black --check src tests
      - run: ruff check src tests
      - run: mypy src
      - run: bandit -r src

  coverage-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
      - run: pip install -e ".[dev]"
      - run: pytest --cov=src --cov-fail-under=95
```

### 9.3 Quality Gates (Enforced in CI)

**All Must Pass**:
1. ✅ **Unit Tests**: 100% pass rate
2. ✅ **Integration Tests**: 100% pass rate
3. ✅ **Coverage**: ≥95% line coverage
4. ✅ **Black**: Code formatted (no changes)
5. ✅ **Ruff**: No linting errors
6. ✅ **Mypy**: No type errors (strict mode)
7. ✅ **Bandit**: No security issues

**Failure = PR Blocked**

---

## 10. Common Patterns & Examples

### 10.1 Domain Entity Tests (Pure Logic, No Mocks)

**Pattern**: Arrange-Act-Assert (AAA)

```python
class TestWorkflowEvent:
    """Test WorkflowEvent domain entity."""

    def test_create_with_required_fields(self):
        """Test creating event with minimal required fields."""
        # Arrange: Prepare data
        workflow_id = "wf_123"
        event_type = EventType.WORKFLOW_STARTED

        # Act: Create entity
        event = WorkflowEvent(
            workflow_id=workflow_id,
            event_type=event_type,
        )

        # Assert: Verify invariants
        assert event.workflow_id == workflow_id
        assert event.event_type == event_type
        assert event.event_id is not None  # Auto-generated
        assert event.timestamp is not None  # Auto-generated

    def test_progress_percent_validates_range(self):
        """Test progress_percent must be 0-100."""
        # Arrange: Invalid progress (>100)
        # Act & Assert
        with pytest.raises(ValueError, match="progress_percent must be 0-100"):
            WorkflowEvent(
                workflow_id="wf_123",
                event_type=EventType.ACTIVITY_PROGRESS,
                progress_percent=150,  # Invalid
            )

    def test_is_terminal_returns_true_for_completed_event(self):
        """Test is_terminal() for WORKFLOW_COMPLETED."""
        event = WorkflowEvent(
            workflow_id="wf_123",
            event_type=EventType.WORKFLOW_COMPLETED,
        )

        assert event.is_terminal() is True

    def test_is_terminal_returns_false_for_progress_event(self):
        """Test is_terminal() for ACTIVITY_PROGRESS."""
        event = WorkflowEvent(
            workflow_id="wf_123",
            event_type=EventType.ACTIVITY_PROGRESS,
        )

        assert event.is_terminal() is False

    @pytest.mark.parametrize("event_type,expected", [
        (EventType.WORKFLOW_COMPLETED, True),
        (EventType.WORKFLOW_FAILED, True),
        (EventType.ACTIVITY_COMPLETED, True),
        (EventType.ACTIVITY_FAILED, True),
        (EventType.ACTIVITY_STARTED, False),
        (EventType.ACTIVITY_PROGRESS, False),
    ])
    def test_is_terminal_for_all_event_types(self, event_type, expected):
        """Test is_terminal() for all EventType values (parametrized)."""
        event = WorkflowEvent(workflow_id="wf_123", event_type=event_type)
        assert event.is_terminal() == expected
```

**Coverage**: 100% (pure logic, all branches tested)

### 10.2 Application Layer Tests (With Mocked Ports via TestConfigurator)

**Pattern**: Verify port usage, assert behavior

```python
# tests/unit/application/activities/test_ingestion_activities_with_events.py

import pytest
from application.activities.ingestion_activities import scrape_content_activity
from application.dependencies import get_current_dependencies
from domain.events.event_types import EventType

@pytest.mark.unit
@pytest.mark.asyncio
class TestScraperContentActivityEvents:
    """Test scrape activity event emission."""

    async def test_emits_started_event_at_beginning(self):
        """Test activity emits STARTED event before scraping.

        PATTERN: Configurator-Driven Mocking
        - TestConfigurator wired MockEmitter automatically
        - No manual mocking in test
        """
        # Arrange: Get mock emitter from DI container
        deps = get_current_dependencies()
        mock_emitter = deps.event_emitter
        mock_emitter.clear()

        # Act: Execute activity
        await scrape_content_activity("https://example.com")

        # Assert: STARTED event emitted
        events = mock_emitter.emitted_events
        started_events = [e for e, _ in events if e.event_type == EventType.ACTIVITY_STARTED]

        assert len(started_events) == 1
        assert started_events[0].activity_name == "scrape_content"
        assert started_events[0].progress_percent == 0
        assert "Scraping" in started_events[0].message

    async def test_emits_completed_event_after_success(self):
        """Test activity emits COMPLETED event after scraping."""
        deps = get_current_dependencies()
        mock_emitter = deps.event_emitter
        mock_emitter.clear()

        await scrape_content_activity("https://example.com")

        # Assert: COMPLETED event emitted
        events = mock_emitter.emitted_events
        completed_events = [e for e, _ in events if e.event_type == EventType.ACTIVITY_COMPLETED]

        assert len(completed_events) == 1
        assert completed_events[0].progress_percent == 33  # First activity of 3
        assert "word" in completed_events[0].message.lower()  # "Scraped X words"

    async def test_includes_user_context_in_emission(self):
        """Test activity passes UserContext to emitter."""
        deps = get_current_dependencies()
        mock_emitter = deps.event_emitter
        mock_emitter.clear()

        await scrape_content_activity("https://example.com")

        # Assert: UserContext passed
        _, user_context = mock_emitter.emitted_events[0]
        assert user_context.user_id is not None

    async def test_emission_failure_does_not_break_activity(self):
        """Test fire-and-forget: Emitter exception doesn't propagate.

        PATTERN: Replace mock with failing mock
        """
        # Arrange: Inject failing emitter
        from unittest.mock import AsyncMock

        deps = get_current_dependencies()
        failing_emitter = AsyncMock()
        failing_emitter.emit.side_effect = Exception("Ably down")

        # Temporarily replace emitter (monkeypatch)
        from application.dependencies import set_current_dependencies, ApplicationDependencies
        failing_deps = ApplicationDependencies(
            content_scraper=deps.content_scraper,
            bibtex_extractor=deps.bibtex_extractor,
            content_persistence=deps.content_persistence,
            event_emitter=failing_emitter,
            auth_provider=deps.auth_provider,
        )
        set_current_dependencies(failing_deps)

        # Act: Should NOT raise exception
        result = await scrape_content_activity("https://example.com")

        # Assert: Activity completed despite emission failure
        assert result.title == "Mock Article Title"

        # Restore original dependencies
        configurator = TestConfigurator()
        configurator.configure_and_initialize()
```

### 8.3 Parametrized Tests (Reduce Duplication)

**Use `@pytest.mark.parametrize` for multiple inputs**:

```python
@pytest.mark.parametrize("input_value,expected_output,description", [
    ("user_123", "user:user_123", "User-scoped namespace"),
    ("org_abc", "org:org_abc", "Org-scoped namespace"),
])
def test_channel_namespace_formats(input_value, expected_output, description):
    """Test channel namespace formatting (parametrized)."""
    # Test logic using input_value and expected_output
    ...

@pytest.mark.parametrize("invalid_id", [
    "",           # Empty
    "user:123",   # Contains colon
    None,         # None
])
def test_channel_name_rejects_invalid_ids(invalid_id):
    """Test ChannelName validation rejects invalid IDs."""
    with pytest.raises(ValueError):
        ChannelName(workflow_id=invalid_id, user_id="user_123")
```

### 8.4 Async Test Fixtures

**For Async Setup/Teardown**:

```python
@pytest.fixture
async def temp_postgres_data():
    """Create test data in database, cleanup after."""
    from infrastructure.database.engine import get_engine
    from sqlalchemy.ext.asyncio import AsyncSession

    engine = get_engine()
    async with AsyncSession(engine) as session:
        async with session.begin():
            # Insert test data
            source = WebSource.create(name="Test", url="https://test.com")
            session.add(to_db_model(source))

        yield source

        # Cleanup
        async with session.begin():
            await session.execute(delete(ContentSourceModel).where(...))
```

---

## 11. Coverage Strategy (100% Target)

### 11.1 Coverage Measurement

**Run Coverage**:
```bash
# Terminal output with missing lines
pytest --cov=src --cov-report=term-missing

# HTML report (most useful for identifying gaps)
pytest --cov=src --cov-report=html
open tests-output/coverage-html/index.html

# JSON for programmatic analysis
pytest --cov=src --cov-report=json
cat tests-output/coverage.json | jq '.totals.percent_covered'
```

**Enforce Minimum**:
```bash
# Fail if coverage <95%
pytest --cov=src --cov-fail-under=95
```

### 11.2 Achieving 100% Coverage (Layer by Layer)

**Domain Layer** (Target: 100%):
```python
# For every domain entity/value object:
# 1. Test creation (factory methods)
# 2. Test all invariants (__post_init__ validation)
# 3. Test all public methods
# 4. Test all properties
# 5. Test edge cases (None, empty, boundary values)
# 6. Test __repr__, __str__ if overridden

class TestUserContext:
    def test_create_minimal(self): ...             # Happy path
    def test_create_with_all_fields(self): ...     # Full data
    def test_requires_user_id(self): ...           # Invariant
    def test_channel_namespace_org(self): ...      # Method - org case
    def test_channel_namespace_user(self): ...     # Method - user case
    def test_workflow_channel(self): ...           # Method
    def test_to_schema(self): ...                  # Serialization
    def test_from_schema(self): ...                # Deserialization
    def test_to_dict(self): ...                    # JSON serialization
    def test_repr(self): ...                       # String representation
```

**Application Layer** (Target: 100%):
```python
# For every activity:
# 1. Test successful execution (happy path)
# 2. Test with all port methods called
# 3. Test error handling (port raises exception)
# 4. Test event emission (if applicable)
# 5. Test UserContext access

# For every workflow:
# 1. Test activity execution order
# 2. Test retry policies triggered
# 3. Test failure handling
# 4. Test UserContext binding
```

**Infrastructure Layer** (Target: 95%):
```python
# For every adapter:
# 1. Test port interface compliance
# 2. Test configuration from settings
# 3. Test successful operation (mock external SDK)
# 4. Test error handling (external SDK raises)
# 5. Test timeout handling
# 6. Test retry logic (if applicable)

# Exception: External SDK integration quirks (may be hard to test)
# Document untested lines with # pragma: no cover if justified
```

### 11.3 Branch Coverage (Beyond Line Coverage)

**Enable Branch Coverage**:
```toml
[tool.coverage.run]
branch = true  # Enable branch coverage
```

**Test All Branches**:
```python
def workflow_channel(self, workflow_id: str) -> ChannelName:
    """Get channel name - has branching logic."""
    if self.org_id:  # Branch 1
        return ChannelName(..., org_id=self.org_id)
    else:  # Branch 2
        return ChannelName(..., org_id=None)

# Tests MUST cover both branches:
def test_workflow_channel_with_org():     # Tests Branch 1
def test_workflow_channel_without_org():  # Tests Branch 2
```

**Pytest-cov Reports Branch Coverage**:
```
Name                    Stmts   Miss  Branch  BrPart  Cover
src/domain/user_context    45      0      12       0   100%
                                          ^^       ^^
                                     12 branches, 0 partial (100% branch coverage)
```

### 11.4 Handling Uncoverable Code

**Justified Exclusions** (use sparingly):

```python
# Platform-specific code
if sys.platform == "win32":  # pragma: no cover
    # Windows-specific logic (testing on macOS)

# Type checking blocks
if TYPE_CHECKING:  # pragma: no cover
    from pydantic import BaseModel

# Unreachable defensive code
if self.workflow_id is None:  # pragma: no cover
    # workflow_id validated in __post_init__, impossible to be None here
    raise RuntimeError("Impossible state")

# Debug/development code
if settings.debug_mode:  # pragma: no cover
    # Only runs in local development
```

**Document WHY it's uncoverable** in comment!

---

## 12. TDD/BDD Workflow Examples

### 12.1 TDD Example: Implementing ChannelName Value Object

**Step 1: Write First Test (RED)**

```python
# tests/unit/domain/value_objects/test_channel_name.py

def test_channel_name_requires_workflow_id():
    """Test ChannelName validation - workflow_id required."""
    with pytest.raises(ValueError, match="workflow_id.*required"):
        ChannelName(workflow_id="", user_id="user_123")
```

**Run**: `pytest tests/unit/domain/value_objects/test_channel_name.py::test_channel_name_requires_workflow_id`
- ❌ **FAILS**: `ModuleNotFoundError: No module named 'domain.value_objects.channel_name'`

**Step 2: Minimal Implementation (GREEN)**

```python
# src/domain/value_objects/channel_name.py

from dataclasses import dataclass

@dataclass(frozen=True)
class ChannelName:
    workflow_id: str
    user_id: str
    org_id: str | None = None

    def __post_init__(self):
        if not self.workflow_id:
            raise ValueError("workflow_id is required")
```

**Run**: ✅ **PASSES**

**Step 3: Add Next Test (RED)**

```python
def test_channel_name_full_name_org_scoped():
    """Test full_name property for org-scoped channel."""
    channel = ChannelName(workflow_id="wf_123", user_id="user_1", org_id="org_abc")

    assert channel.full_name == "org:org_abc:workflow:wf_123"
```

**Run**: ❌ **FAILS**: `AttributeError: 'ChannelName' object has no attribute 'full_name'`

**Step 4: Implement (GREEN)**

```python
@property
def full_name(self) -> str:
    if self.org_id:
        return f"org:{self.org_id}:workflow:{self.workflow_id}"
    return f"user:{self.user_id}:workflow:{self.workflow_id}"
```

**Run**: ✅ **PASSES**

**Step 5: Refactor**
- Extract `"workflow:"` constant
- Add docstrings
- Run tests again: ✅ Still passes

**Repeat** until all behaviors tested (100% coverage)

### 12.2 BDD Example: Activity Event Emission

**Scenario**: scrape_content_activity emits progress events

**Feature File** (Gherkin - optional, for documentation):
```gherkin
Feature: Activity Event Emission
  As a user
  I want to see real-time progress when content is being scraped
  So that I know the system is working

  Scenario: Successful scraping emits events
    Given a valid URL "https://example.com/article"
    When scrape_content_activity executes
    Then it emits ACTIVITY_STARTED event with 0% progress
    And it calls the scraper port to fetch content
    And it emits ACTIVITY_COMPLETED event with 33% progress

  Scenario: Scraping failure emits error event
    Given an invalid URL that causes scraping to fail
    When scrape_content_activity executes
    Then it emits ACTIVITY_FAILED event with error message
    And it re-raises exception for Temporal retry
```

**Pytest Implementation** (BDD-style):

```python
@pytest.mark.unit
@pytest.mark.asyncio
class TestScraperContentActivityEventEmission:
    """BDD: Activity event emission scenarios."""

    async def test_given_valid_url_when_scrape_then_emits_started_and_completed(self):
        """Scenario: Successful scraping emits events."""
        # Given: Valid URL
        url = "https://example.com/article"

        # And: Mock emitter from TestConfigurator
        deps = get_current_dependencies()
        mock_emitter = deps.event_emitter
        mock_emitter.clear()

        # When: Activity executes
        await scrape_content_activity(url)

        # Then: Emits STARTED event with 0% progress
        events = mock_emitter.emitted_events
        started = [e for e, _ in events if e.event_type == EventType.ACTIVITY_STARTED][0]

        assert started.activity_name == "scrape_content"
        assert started.progress_percent == 0
        assert "Scraping" in started.message

        # And: Emits COMPLETED event with 33% progress
        completed = [e for e, _ in events if e.event_type == EventType.ACTIVITY_COMPLETED][0]

        assert completed.progress_percent == 33
        assert "Scraped" in completed.message

    async def test_given_scraper_fails_when_execute_then_emits_failed_event_and_raises(self):
        """Scenario: Scraping failure emits error event."""
        # Given: Scraper that raises exception
        from unittest.mock import AsyncMock

        deps = get_current_dependencies()
        failing_scraper = AsyncMock()
        failing_scraper.scrape.side_effect = Exception("Network timeout")

        # Inject failing scraper
        from application.dependencies import set_current_dependencies, ApplicationDependencies
        failing_deps = ApplicationDependencies(
            content_scraper=failing_scraper,
            bibtex_extractor=deps.bibtex_extractor,
            content_persistence=deps.content_persistence,
            event_emitter=deps.event_emitter,
            auth_provider=deps.auth_provider,
        )
        set_current_dependencies(failing_deps)

        mock_emitter = deps.event_emitter
        mock_emitter.clear()

        # When: Activity executes
        # Then: Raises exception (for Temporal retry)
        with pytest.raises(Exception, match="Network timeout"):
            await scrape_content_activity("https://example.com")

        # And: Emits FAILED event before raising
        events = mock_emitter.emitted_events
        failed = [e for e, _ in events if e.event_type == EventType.ACTIVITY_FAILED][0]

        assert failed.error_message == "Network timeout"
        assert failed.error_code == "SCRAPING_FAILED"
```

---

## 13. Adapter Testing (Port Contract Compliance)

### 13.1 Port Contract Testing

**Verify adapter implements port correctly**:

```python
# tests/unit/infrastructure/adapters/test_ably_emitter.py

import pytest
from application.ports.driven.for_emitting_events import ForEmittingEvents
from infrastructure.adapters.event_emitters.ably_emitter import AblyEmitter

class TestAblyEmitterPortCompliance:
    """Test AblyEmitter implements ForEmittingEvents contract."""

    def test_implements_for_emitting_events_port(self):
        """Test AblyEmitter is subclass of ForEmittingEvents."""
        assert issubclass(AblyEmitter, ForEmittingEvents)

    def test_has_emit_method(self):
        """Test AblyEmitter has emit() method with correct signature."""
        import inspect

        emit_method = getattr(AblyEmitter, "emit", None)
        assert emit_method is not None
        assert asyncio.iscoroutinefunction(emit_method)

        # Check signature
        sig = inspect.signature(emit_method)
        params = list(sig.parameters.keys())
        assert "event" in params
        assert "user_context" in params

@pytest.mark.unit
class TestAblyEmitterBehavior:
    """Test AblyEmitter behavior (with mocked Ably SDK)."""

    @patch("infrastructure.adapters.event_emitters.ably_emitter.AblyRest")
    async def test_publishes_to_channel_derived_from_user_context(self, mock_ably):
        """Test channel name derived from UserContext."""
        # Arrange
        mock_client = MagicMock()
        mock_channel = MagicMock()
        mock_ably.return_value = mock_client
        mock_client.channels.get.return_value = mock_channel

        emitter = AblyEmitter()
        event = WorkflowEvent(workflow_id="wf_123", event_type=EventType.WORKFLOW_STARTED)
        user_ctx = UserContext(user_id="user_1", org_id="org_abc")

        # Act
        await emitter.emit(event, user_ctx)

        # Assert: Called with org-scoped channel
        mock_client.channels.get.assert_called_once_with("org:org_abc:workflow:wf_123")

    @patch("infrastructure.adapters.event_emitters.ably_emitter.AblyRest")
    async def test_serializes_event_to_dict(self, mock_ably):
        """Test event serialization before publishing."""
        mock_client = MagicMock()
        mock_channel = MagicMock()
        mock_ably.return_value = mock_client
        mock_client.channels.get.return_value = mock_channel

        emitter = AblyEmitter()
        event = WorkflowEvent(
            workflow_id="wf_123",
            event_type=EventType.ACTIVITY_PROGRESS,
            progress_percent=50,
            message="Halfway done",
        )
        user_ctx = UserContext(user_id="user_1")

        await emitter.emit(event, user_ctx)

        # Assert: Published dict payload
        call_args = mock_channel.publish.call_args
        payload = call_args[0][1]  # Second arg to publish()

        assert payload["workflow_id"] == "wf_123"
        assert payload["event_type"] == "activity.progress"
        assert payload["progress_percent"] == 50
        assert payload["message"] == "Halfway done"
```

### 13.2 Configuration Testing

**Test adapters read from Pydantic Settings**:

```python
def test_ably_emitter_reads_api_key_from_settings():
    """Test AblyEmitter gets API key from settings (not hardcoded)."""
    from config import get_settings

    settings = get_settings()

    # Verify setting exists (hierarchical: settings.secrets.ably_api_key)
    assert hasattr(settings.secrets, "ably_api_key")

    # Verify adapter uses it
    with patch("infrastructure.adapters.event_emitters.ably_emitter.AblyRest") as mock_ably:
        emitter = AblyEmitter()
        # AblyRest should be called with API key from settings.secrets
        mock_ably.assert_called_once_with(settings.secrets.ably_api_key.get_secret_value())

def test_ably_emitter_fails_if_api_key_missing():
    """Test AblyEmitter fails fast if API key not configured."""
    with patch("infrastructure.adapters.event_emitters.ably_emitter.get_settings") as mock_settings:
        mock_settings.return_value.secrets.ably_api_key = None

        with pytest.raises(ValueError, match="Ably API key not configured"):
            AblyEmitter()
```

---

## 14. Integration Testing Strategy

### 14.1 When to Write Integration Tests

**Write Integration Tests For**:
- ✅ Database operations (real PostgreSQL queries)
- ✅ External APIs (real Ably, real Clerk - in test environment)
- ✅ Temporal workflows (real Temporal server)
- ✅ Complex adapter logic that can't be fully mocked

**Don't Write Integration Tests For**:
- ❌ Domain logic (use unit tests)
- ❌ Simple adapters (unit tests with mocked SDK sufficient)
- ❌ Happy path already covered by unit tests

### 14.2 Integration Test Patterns

**Database Integration Test**:

```python
# tests/integration/adapters/test_postgres_content_persistence_integration.py

import pytest
from infrastructure.adapters.content_persistence_service import PostgresContentPersistenceService
from application.ports.driven.for_scraping_content import ScrapedContent

@pytest.mark.integration
@pytest.mark.asyncio
async def test_save_article_with_source_persists_to_database():
    """Integration: Verify save_article_with_source writes to PostgreSQL.

    REAL DATABASE:
    - Uses WorkerConfigurator (real Postgres)
    - Executes actual SQL queries
    - Verifies data in database
    """
    # Arrange
    service = PostgresContentPersistenceService()
    content = ScrapedContent(
        title="Integration Test Article",
        text="Test content",
        markdown="# Test",
        source_url="https://integration-test.com/article",
    )
    bibtex = {
        "@type": "article",
        "title": "Integration Test",
        "author": ["Test Author"],
        "year": "2024",
        "url": "https://integration-test.com/article",
    }

    # Act
    article_id = await service.save_article_with_source(content, bibtex)

    # Assert: Article exists in database
    retrieved = await service.find_by_id(article_id)

    assert retrieved is not None
    assert retrieved.title == "Integration Test Article"
    assert retrieved.bibtex["title"] == "Integration Test"

    # Cleanup (optional - use transactional fixtures for auto-rollback)
```

**Ably Integration Test**:

```python
# tests/integration/adapters/test_ably_emitter_integration.py

@pytest.mark.integration
@pytest.mark.asyncio
async def test_ably_emitter_end_to_end(ably_test_client):
    """Integration: Verify AblyEmitter publishes to real Ably."""
    emitter = AblyEmitter()

    event = WorkflowEvent(
        workflow_id="integration-wf-123",
        event_type=EventType.ACTIVITY_STARTED,
        message="Integration test",
    )
    user_ctx = UserContext(user_id="test_user", org_id="test_org")

    # Subscribe to channel
    channel_name = str(user_ctx.workflow_channel(event.workflow_id))
    channel = ably_test_client.channels.get(channel_name)

    received = []
    channel.subscribe("workflow_event", lambda msg: received.append(msg.data))

    # Act: Emit via adapter
    await emitter.emit(event, user_ctx)

    # Wait for delivery
    await asyncio.sleep(0.5)

    # Assert: Received in Ably
    assert len(received) == 1
    assert received[0]["workflow_id"] == "integration-wf-123"
```

### 14.3 Transactional Fixtures (Auto-Rollback)

**Best Practice**: Wrap integration tests in transactions, rollback after

```python
# tests/integration/conftest.py

@pytest.fixture
async def db_session():
    """Provide database session with auto-rollback.

    PATTERN: Transactional Test
    - Begin transaction
    - Run test
    - Rollback (even if test fails)
    - No cleanup needed
    """
    from infrastructure.database.engine import get_engine
    from sqlalchemy.ext.asyncio import AsyncSession

    engine = get_engine()
    async with AsyncSession(engine) as session:
        async with session.begin():
            yield session
            # Implicit rollback (don't commit)

# Usage in tests
@pytest.mark.integration
async def test_save_article(db_session):
    """Test save with auto-rollback (no database pollution)."""
    # Save to db_session
    # ...
    # After test: Automatic rollback, database unchanged
```

---

## 15. Fitness Function Tests (Architecture Enforcement)

### 15.1 Dependency Rule Enforcement

**Test**: Domain → Application → Infrastructure (dependencies flow inward)

```python
# tests/fitness/test_dependency_rules.py

import pytest
import ast
import os
from pathlib import Path

def test_domain_has_no_infrastructure_imports():
    """Fitness: Domain layer must not import from infrastructure.

    HEXAGONAL ARCHITECTURE RULE:
    - Domain is pure Python
    - Domain cannot depend on infrastructure (Ably, Clerk, SQLAlchemy)
    """
    domain_dir = Path("src/domain")

    violations = []
    for py_file in domain_dir.rglob("*.py"):
        with open(py_file) as f:
            tree = ast.parse(f.read(), filename=str(py_file))

        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                if node.module and "infrastructure" in node.module:
                    violations.append(f"{py_file}: imports {node.module}")

    assert len(violations) == 0, f"Domain imports infrastructure:\n" + "\n".join(violations)

def test_application_has_no_infrastructure_imports():
    """Fitness: Application layer imports only domain and ports."""
    application_dir = Path("src/application")

    allowed_imports = {"domain", "application"}
    violations = []

    for py_file in application_dir.rglob("*.py"):
        if "ports" in str(py_file):
            continue  # Ports can't import anything except domain

        with open(py_file) as f:
            tree = ast.parse(f.read(), filename=str(py_file))

        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                if node.module:
                    root = node.module.split(".")[0]
                    if root not in allowed_imports and root != "typing":
                        violations.append(f"{py_file}: imports {node.module}")

    assert len(violations) == 0, f"Application imports infrastructure:\n" + "\n".join(violations)
```

### 15.2 Configuration Quality Tests

**Test**: No magic strings (all config via Pydantic Settings)

```python
# tests/fitness/test_no_magic_strings.py

import subprocess

def test_no_os_getenv_in_src():
    """Fitness: No os.getenv() calls (use Pydantic Settings).

    ZERO TOLERANCE POLICY:
    - All config via Settings
    - No os.getenv() or os.environ[]
    """
    result = subprocess.run(
        ["grep", "-r", "os.getenv", "src/", "--include=*.py"],
        capture_output=True,
        text=True,
    )

    assert result.returncode != 0, f"Found os.getenv() in src/:\n{result.stdout}"

def test_no_hardcoded_urls():
    """Fitness: No hardcoded URLs (use settings)."""
    result = subprocess.run(
        ["grep", "-rE", r'"https?://[^"]+\.com"', "src/", "--include=*.py"],
        capture_output=True,
        text=True,
    )

    # Filter out comments and docstrings (allowed)
    violations = [line for line in result.stdout.split("\n")
                  if line and "#" not in line and '"""' not in line]

    assert len(violations) == 0, f"Found hardcoded URLs:\n" + "\n".join(violations)
```

### 15.3 Port Compliance Tests

**Test**: All adapters implement their port interface

```python
# tests/fitness/test_port_compliance.py

def test_all_scrapers_implement_for_scraping_content():
    """Fitness: All scraper adapters implement ForScrapingContent."""
    from application.ports.driven.for_scraping_content import ForScrapingContent
    from infrastructure.adapter_registry import CONTENT_SCRAPER_REGISTRY

    for name, adapter_class in CONTENT_SCRAPER_REGISTRY.items():
        assert issubclass(adapter_class, ForScrapingContent), \
            f"Adapter {name} does not implement ForScrapingContent"

def test_all_emitters_implement_for_emitting_events():
    """Fitness: All event emitters implement ForEmittingEvents."""
    from application.ports.driven.for_emitting_events import ForEmittingEvents
    from infrastructure.adapter_registry import EVENT_EMITTER_REGISTRY

    for name, adapter_class in EVENT_EMITTER_REGISTRY.items():
        assert issubclass(adapter_class, ForEmittingEvents), \
            f"Emitter {name} does not implement ForEmittingEvents"
```

---

## 16. Testing Best Practices

### 16.1 Dos and Don'ts

**DO**:
- ✅ Write tests FIRST (TDD)
- ✅ Test behavior, not implementation
- ✅ Use TestConfigurator for unit tests (automatic mocking)
- ✅ Use descriptive test names (`test_given_when_then`)
- ✅ One assertion per test (ideal)
- ✅ Clean up after integration tests
- ✅ Run tests frequently (every file save)
- ✅ Parametrize similar tests
- ✅ Use fixtures for shared setup
- ✅ Mock external SDKs (Ably, Clerk), not internal code

**DON'T**:
- ❌ Skip tests ("we'll add them later")
- ❌ Test private methods (test public interface)
- ❌ Share state between tests (use fixtures)
- ❌ Make tests depend on order
- ❌ Mock everything (domain tests need NO mocks)
- ❌ Write slow unit tests (if >100ms, it's not a unit test)
- ❌ Ignore flaky tests (fix immediately)
- ❌ Use `pytest.skip` without justification
- ❌ Hard-code test data (use fixtures/factories)

### 16.2 Flaky Test Prevention

**Common Causes**:
1. **Timing dependencies** - `await asyncio.sleep(1)` in tests
   - Fix: Use `pytest.wait_for` or event-based synchronization
2. **Shared state** - Global variables, database pollution
   - Fix: Transactional fixtures, clear mocks between tests
3. **Random data** - UUIDs, timestamps without seeding
   - Fix: Freeze time, use deterministic IDs in tests
4. **External services** - Real API calls in unit tests
   - Fix: Use TestConfigurator (mocks), save integration tests for CI

**Detect Flaky Tests**:
```bash
# Run test 100 times, should pass 100 times
pytest tests/unit/domain/test_user_context.py --count=100
```

### 16.3 Test Performance

**Keep Tests Fast**:
- **Unit tests**: <1ms per test (target: <100ms for entire suite)
- **Integration tests**: <1 second per test
- **E2E tests**: <2 minutes per test

**Optimize Slow Tests**:
```python
# Slow (avoid)
@pytest.fixture(scope="function")  # Creates new DB session for EVERY test
def db_session(): ...

# Fast (prefer)
@pytest.fixture(scope="session")  # Creates DB session ONCE for all tests
def db_session(): ...
```

**Profile Tests**:
```bash
# Show 10 slowest tests
pytest --durations=10
```

---

## 17. Coverage Gaps & Remediation

### 17.1 Identifying Gaps

**Weekly Coverage Review**:
```bash
# Generate coverage report
pytest --cov=src --cov-report=html

# Open report
open tests-output/coverage-html/index.html

# Look for:
# 1. Red lines (not executed)
# 2. Yellow lines (partial branch coverage)
# 3. Modules with <95% coverage
```

**Example Gap**:
```
src/domain/entities/user_context.py: 87% coverage

Missing lines: 45-47 (error handling in workflow_channel)
```

### 17.2 Writing Tests for Gaps

**Gap**: Line 45-47 not covered

```python
# src/domain/entities/user_context.py (uncovered)
def workflow_channel(self, workflow_id: str) -> ChannelName:
    if not workflow_id:  # Line 45 (not covered)
        raise ValueError("workflow_id cannot be empty")  # Line 46
    return ChannelName(...)  # Line 47
```

**Fix**: Add test for empty workflow_id

```python
# tests/unit/domain/entities/test_user_context.py

def test_workflow_channel_rejects_empty_workflow_id():
    """Test workflow_channel validates workflow_id is non-empty."""
    ctx = UserContext(user_id="user_123")

    with pytest.raises(ValueError, match="workflow_id cannot be empty"):
        ctx.workflow_channel("")  # Tests line 45-46

# Re-run coverage
pytest --cov=src --cov-report=term-missing
# src/domain/entities/user_context.py: 100% coverage ✅
```

### 17.3 Pragmatic Exceptions

**When <100% is Acceptable**:
1. **Defensive code that's unreachable** (document with `# pragma: no cover`)
2. **Platform-specific branches** (Windows vs. Linux)
3. **Debug code** (only runs with DEBUG=true)
4. **Type checking blocks** (`if TYPE_CHECKING:`)

**Document WHY**:
```python
if self.workflow_id is None:  # pragma: no cover
    # workflow_id validated in __post_init__, impossible to be None here
    # This is defensive code for type checker satisfaction
    raise RuntimeError("Impossible state: workflow_id is None")
```

---

## 18. Test Execution Strategies

### 18.1 Development Workflow (Fast Feedback)

**TDD Cycle** (during feature development):
```bash
# 1. Write test (RED)
# File: tests/unit/domain/entities/test_user_context.py

# 2. Run single test
pytest tests/unit/domain/entities/test_user_context.py::test_requires_user_id -v

# 3. Implement (GREEN)
# File: src/domain/entities/user_context.py

# 4. Run test again
pytest tests/unit/domain/entities/test_user_context.py::test_requires_user_id -v

# 5. Refactor, run ALL domain tests
pytest tests/unit/domain/ -v

# 6. Run ALL unit tests (should still pass)
pytest -m unit
```

**Watch Mode** (auto-run on file changes):
```bash
# Install pytest-watch
pip install pytest-watch

# Run tests on every save
ptw -- -m unit
```

### 18.2 Pre-Commit Hook (Local Quality Gate)

**Install pre-commit**:
```bash
pip install pre-commit
pre-commit install
```

**.pre-commit-config.yaml**:
```yaml
repos:
  - repo: local
    hooks:
      - id: pytest-unit
        name: Run Unit Tests
        entry: pytest -m unit --cov=src --cov-fail-under=95
        language: system
        pass_filenames: false
        always_run: true

      - id: black
        name: Format with black
        entry: black
        language: system
        types: [python]

      - id: ruff
        name: Lint with ruff
        entry: ruff check
        language: system
        types: [python]
```

**Result**: Tests run automatically before every commit!

### 18.3 CI/CD Execution (Comprehensive)

**PR Checks** (GitHub Actions):
1. Unit tests (fast, 30 seconds)
2. Integration tests (medium, 2 minutes)
3. Quality checks (black, ruff, mypy, bandit)
4. Coverage gate (fail if <95%)

**Main Branch Checks** (After Merge):
1. All of PR checks
2. E2E tests (slow, 10 minutes)
3. Deploy to staging
4. Smoke tests on staging

---

## 19. Summary & Quick Reference

### 19.1 Testing Pyramid Quick Reference

```
Test Type     | Count  | Speed      | Scope              | Configurator
--------------|--------|------------|--------------------|---------------
Unit          | ~400   | <1s total  | Single component   | TestConfigurator (mocks)
Integration   | ~80    | ~2min      | Component + real service | WorkerConfigurator (real)
E2E           | ~10    | ~10min     | Full system        | Full stack
Fitness       | ~5     | <5s        | Architecture rules | N/A (static analysis)
```

### 19.2 TDD Red-Green-Refactor Cheat Sheet

```
1. 🔴 RED:   Write failing test
   → pytest tests/unit/.../test_foo.py::test_bar
   → ❌ FAILS (feature doesn't exist)

2. 🟢 GREEN: Minimal implementation
   → Write just enough code to pass
   → pytest tests/unit/.../test_foo.py::test_bar
   → ✅ PASSES

3. 🔵 REFACTOR: Clean up code
   → Add docstrings, extract constants, apply SOLID
   → pytest tests/unit/.../test_foo.py::test_bar
   → ✅ STILL PASSES

4. 🔁 REPEAT: Next test
```

### 19.3 Coverage Commands Cheat Sheet

```bash
# Run all tests with coverage
pytest --cov=src

# Run with HTML report
pytest --cov=src --cov-report=html
open tests-output/coverage-html/index.html

# Run with terminal missing lines
pytest --cov=src --cov-report=term-missing

# Fail if coverage <95%
pytest --cov=src --cov-fail-under=95

# Coverage for specific module
pytest --cov=src/domain/entities/user_context

# Branch coverage
pytest --cov=src --cov-branch
```

### 19.4 Configurator Pattern Testing Cheat Sheet

```python
# Unit tests (automatic mocking via TestConfigurator)
# tests/conftest.py wires TestConfigurator globally
# NO manual mocking needed!

async def test_activity():
    result = await scrape_content_activity("https://example.com")
    assert result.title == "Mock Article Title"  # From MockContentScraper

# Integration tests (override with WorkerConfigurator)
# tests/integration/conftest.py wires WorkerConfigurator
# REAL adapters used automatically!

@pytest.mark.integration
async def test_real_scraping():
    result = await scrape_content_activity("https://real-site.com")
    assert result.title != "Mock Article Title"  # Real scraping

# Access mocks for verification
deps = get_current_dependencies()
mock_emitter = deps.event_emitter
assert len(mock_emitter.emitted_events) > 0
```

---

## 20. Implementation Checklist

### Phase 1: Setup Testing Infrastructure
- [ ] Update `tests/conftest.py` - Add event_emitter, auth_provider to TestConfigurator
- [ ] Update `tests/integration/conftest.py` - Add Ably/Clerk fixtures
- [ ] Create `tests/fixtures/domain_factories.py` - UserContext, WorkflowEvent factories
- [ ] Update `pytest.ini` - Add coverage settings, branch=true
- [ ] Update `pyproject.toml` - Set fail_under=95

### Phase 2: Domain Layer Tests (100% Coverage)
- [ ] Write tests: `tests/unit/domain/entities/test_user_context.py` (10+ tests)
- [ ] Write tests: `tests/unit/domain/events/test_workflow_event.py` (15+ tests)
- [ ] Write tests: `tests/unit/domain/events/test_event_types.py` (5+ tests)
- [ ] Write tests: `tests/unit/domain/value_objects/test_channel_name.py` (10+ tests)
- [ ] Verify: `pytest tests/unit/domain/ --cov=src/domain --cov-report=term-missing`
- [ ] Target: 100% coverage

### Phase 3: Application Layer Tests (100% Coverage)
- [ ] Write tests: `tests/unit/application/activities/test_ingestion_activities_events.py` (20+ tests)
- [ ] Write tests: `tests/unit/application/workflows/test_content_ingestion_with_user_context.py` (10+ tests)
- [ ] Write tests: `tests/unit/application/utilities/test_user_context_binding.py` (5+ tests)
- [ ] Verify: `pytest tests/unit/application/ --cov=src/application --cov-report=term-missing`
- [ ] Target: 100% coverage

### Phase 4: Infrastructure Layer Tests (95% Coverage)
- [ ] Write tests: `tests/unit/infrastructure/adapters/event_emitters/test_ably_emitter.py` (15+ tests)
- [ ] Write tests: `tests/unit/infrastructure/adapters/event_emitters/test_mock_emitter.py` (5+ tests)
- [ ] Write tests: `tests/unit/infrastructure/adapters/auth/test_clerk_auth_provider.py` (10+ tests)
- [ ] Write tests: `tests/unit/infrastructure/adapters/auth/test_mock_auth_provider.py` (5+ tests)
- [ ] Update tests: `tests/unit/infrastructure/configurators/test_configurators.py` - Verify event_emitter wiring
- [ ] Verify: `pytest tests/unit/infrastructure/ --cov=src/infrastructure --cov-report=term-missing`
- [ ] Target: 95% coverage

### Phase 5: Integration Tests (Critical Paths)
- [ ] Write tests: `tests/integration/adapters/test_ably_emitter_integration.py` (5+ tests)
- [ ] Write tests: `tests/integration/adapters/test_clerk_auth_integration.py` (5+ tests)
- [ ] Write tests: `tests/integration/workflows/test_content_ingestion_with_events.py` (3+ tests)
- [ ] Verify: `pytest -m integration` (should use real Ably/Clerk/DB)

### Phase 6: E2E Tests (Smoke Tests)
- [ ] Write tests: `tests/e2e/test_workflow_streaming_e2e.py` (2-3 critical journeys)
- [ ] Setup Playwright in CI/CD
- [ ] Verify: `pytest -m e2e` (full system test)

### Phase 7: Fitness Functions (Architecture Enforcement)
- [ ] Write tests: `tests/fitness/test_dependency_rules.py`
- [ ] Write tests: `tests/fitness/test_no_magic_strings.py`
- [ ] Write tests: `tests/fitness/test_port_compliance.py`

### Phase 8: Documentation & CI/CD
- [ ] Update `_docs/testing-strategy.md` (this document!)
- [ ] Create `.github/workflows/test.yml` - CI/CD pipeline
- [ ] Add coverage badge to README
- [ ] Document testing workflow in CONTRIBUTING.md

---

## 21. Appendix

### 21.1 Pytest Plugins Recommended

```bash
# Install
pip install pytest pytest-asyncio pytest-cov pytest-mock pytest-xdist pytest-watch

# pyproject.toml
[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",      # Async test support
    "pytest-cov>=5.0",            # Coverage
    "pytest-mock>=3.12",          # Mocking utilities
    "pytest-xdist>=3.5",          # Parallel execution
    "pytest-watch>=4.2",          # Auto-run on file changes
    "playwright>=1.40",           # E2E browser testing
]
```

### 21.2 Coverage Tools

**HTML Report Navigation**:
1. Open `tests-output/coverage-html/index.html`
2. Click module → See highlighted code
3. Red = not covered, green = covered, yellow = partial branch

**Coverage Badges** (for README):
```markdown
![Coverage](https://img.shields.io/codecov/c/github/youruser/blackswans)
```

### 21.3 Useful Testing Resources

- **pytest docs**: https://docs.pytest.org/
- **pytest-asyncio**: https://pytest-asyncio.readthedocs.io/
- **Playwright**: https://playwright.dev/python/
- **TDD by Example** (Kent Beck)
- **Growing Object-Oriented Software, Guided by Tests** (Freeman & Pryce)

---

**Testing Strategy Complete**
**Coverage Target**: 100% (aspirational), 95% enforced
**Key Pattern**: Configurator-driven mocking for clean test isolation

---

*This strategy aligns with BlackSwans.ai's Hexagonal Architecture, DDD principles, and Configurator Port Pattern. Follow this guide to achieve 100% test coverage with confidence.*

**Last Updated**: 2025-12-14
**Next Review**: After Phase 2 implementation (Q1 2026)
