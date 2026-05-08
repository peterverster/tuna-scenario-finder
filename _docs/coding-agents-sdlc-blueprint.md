# Coding Agents SDLC Blueprint

A repeatable software development lifecycle for AI-assisted engineering using coding agents and generative AI.

---

## Overview

This blueprint establishes a **standardized SDLC** optimized for coding agents (Claude Code, GitHub Copilot, Cursor, etc.) that enables consistent, high-quality software delivery through:

1. **Repeatable Processes** - Structured phases from problem identification to implementation
2. **Repeatable Architecture Patterns** - Consistent implementation across the technology stack
3. **Agent-Discoverable Conventions** - Predictable locations for context and guidance

**Core Principle**: Structure enables autonomy. When projects follow predictable conventions, coding agents work more effectively and produce consistent results aligned with established architectural patterns.

---

## Purpose & Usage

### What This Document Is

This blueprint serves as the **master reference** for:

- **SDLC phases** orchestrated through agent commands (`/problem`, `/adr`, `/specify`, `/plan-feature`, `/implement`)
- **Directory conventions** that enable agent discovery and context gathering
- **Quality gates** that enforce consistency at each phase
- **Integration points** with architecture patterns for implementation guidance

### How to Use This Document

1. **Project Setup**: Follow the Adoption Guide to establish the directory structure
2. **Feature Development**: Use the Command Workflow to guide work through phases
3. **Implementation**: Reference `_templates/architecture-patterns.md` for structural guidance
4. **Quality Assurance**: Follow the quality gates defined at each phase

### Related Documents

| Document | Purpose | When to Reference |
|----------|---------|-------------------|
| `_templates/architecture-patterns.md` | Implementation patterns (Hexagonal, Ports & Adapters, Events) | During `/plan-feature` and `/implement` |
| `CLAUDE.md` | Project-specific conventions and commands | Always (primary context) |
| `_domain/*.md` | Domain model and ubiquitous language | During specification and implementation |
| `_adr/*.md` | Architectural decisions and rationale | When making or reviewing decisions |

---

## Motivation

### The Problem

AI coding agents struggle with:
- **Context fragmentation** - Important information scattered across random locations
- **Implicit knowledge** - Conventions exist only in developers' heads
- **Workflow ambiguity** - No clear path from idea to implementation
- **Quality inconsistency** - No standardized gates or checkpoints
- **Architecture drift** - Implementations diverge from established patterns

### The Solution

This SDLC blueprint solves these problems by establishing:

1. **Predictable directories** - Agents know where to find and place artifacts
2. **Explicit documentation** - `CLAUDE.md` as single source of truth
3. **Structured workflow** - Command chain from problem to implementation
4. **Quality gates** - Discoverable validation at each phase
5. **Architecture patterns** - Reusable structural templates for consistent implementation

---

## SDLC Phases

The blueprint defines seven phases, each with dedicated artifacts and quality gates.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        CODING AGENTS SDLC PHASES                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐      │
│  │  BRIEF   │──►│ RESEARCH │──►│ DECISION │──►│ SPECIFY  │──►│   PLAN   │      │
│  │          │   │          │   │          │   │          │   │          │      │
│  │ (intake) │   │ /problem │   │   /adr   │   │ /specify │   │  /plan-  │      │
│  │          │   │          │   │          │   │          │   │ feature  │      │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘      │
│       │              │              │              │              │             │
│       ▼              ▼              ▼              ▼              ▼             │
│   _brief/       _research/      _adr/       _specification/   _plans/          │
│                                                                                  │
│                                                                                  │
│       ┌──────────┐        ┌──────────┐                                          │
│       │IMPLEMENT │───────►│ DOCUMENT │◄─── (continuous, after features)         │
│       │          │        │          │                                          │
│       │/implement│        │   /ddd   │                                          │
│       │          │        │          │                                          │
│       └────┬─────┘        └────┬─────┘                                          │
│            │                   │                                                 │
│            ▼                   ▼                                                 │
│       _progress/           _domain/                                              │
│          src/                                                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Phase Summary

| Phase | Command | Purpose | Input | Output |
|-------|---------|---------|-------|--------|
| **Brief** | (manual) | Capture unstructured inputs and ideas | Any format/modality | Brief documents |
| **Research** | `/problem` | Analyze challenges, evaluate options | Brief or problem statement | Research document |
| **Decision** | `/adr` | Record architectural decisions | Research or statement | ADR document |
| **Specify** | `/specify` | Define requirements unambiguously | Brief + decisions | Specification |
| **Plan** | `/plan-feature` | Create phased implementation plan | Specification | Implementation plan |
| **Implement** | `/implement` | Execute with quality enforcement | Plan | Code + progress logs |
| **Document** | `/ddd` | Generate/update domain documentation | Codebase | Domain docs |

---

## Directory Structure

```
project/
├── CLAUDE.md                 # Project instructions (PRIMARY SOURCE)
│
├── _adr/                     # Architecture Decision Records
│   ├── README.md             # ADR conventions
│   ├── 0001-use-postgresql.md
│   └── 0002-adopt-hexagonal-architecture.md
│
├── _brief/                   # Project briefs and requirements
│   ├── initial-requirements.md
│   └── stakeholder-notes.md
│
├── _docs/                    # General documentation
│   ├── coding-agents-sdlc-blueprint.md  # This file
│   ├── development-setup.md
│   └── deployment.md
│
├── _domain/                  # Domain model documentation (DDD projects)
│   ├── readme.md             # Navigation guide
│   ├── ubiquitous-language.md
│   ├── domain-model.md
│   ├── bounded-contexts.md
│   └── architecture.md
│
├── _plans/                   # Implementation plans
│   └── feature-name-implementation-plan.md
│
├── _progress/                # Progress logs
│   └── YYYYMMDD-HHMM-phase-name.md
│
├── _research/                # Research and investigations
│   └── YYYY-MM-DD-topic-investigation.md
│
├── _specification/           # Feature specifications
│   └── feature-name.md
│
├── _templates/               # Reusable templates
│   ├── architecture-patterns.md  # Implementation patterns reference
│   ├── plan-phase-template.md
│   └── progress-template.md
│
├── .claude/                  # Claude Code configuration
│   └── commands/             # Custom slash commands
│       ├── README.md
│       ├── problem.md        # Research & analysis
│       ├── adr.md            # Architecture Decision Records
│       ├── specify.md        # Feature specification
│       ├── plan-feature.md   # Implementation planning
│       ├── implement.md      # Code execution
│       └── ddd.md            # Domain documentation
│
└── src/                      # Source code
```

### Directory Purposes

| Directory | Purpose | When Created |
|-----------|---------|--------------|
| `CLAUDE.md` | Single source of truth for project guidance | Project setup |
| `_adr/` | Capture architectural decisions with context and rationale | When decisions are made |
| `_brief/` | Store requirements, briefs, stakeholder input | Project inception |
| `_docs/` | General documentation (setup, deployment, operations) | As needed |
| `_domain/` | DDD documentation (entities, contexts, language) | DDD projects only |
| `_plans/` | Implementation plans with phased deliverables | Before implementation |
| `_progress/` | Progress logs tracking completed work | During implementation |
| `_research/` | Investigations, spikes, technical exploration | When exploring options |
| `_specification/` | Feature specifications with requirements | Before planning |
| `_templates/` | Reusable document and architecture templates | Project setup |
| `.claude/commands/` | Custom Claude Code slash commands | Project setup |

### Naming Conventions

**Directories**: Underscore prefix (`_docs/`) distinguishes meta-directories from source code

**Files**:
- Documentation: `kebab-case.md` (e.g., `domain-model.md`)
- ADRs: `NNNN-title-slug.md` (e.g., `0001-use-postgresql.md`)
- Progress: `YYYYMMDD-HHMM-description.md`
- Research: `YYYY-MM-DD-topic.md`

**Source code**: Follow language conventions (Python: `snake_case.py`, JS: `camelCase.js`)

---

## Phase Descriptions

### Brief - Capture Ideas & Inputs

**Purpose**: Capture unstructured inputs, ideas, and requirements from any source before formal processing begins.

**Input**: Any format or modality - the Brief phase is intentionally flexible to accommodate how ideas naturally emerge.

**Output**: Documents in `_brief/`

**When to use**:
- Project inception with stakeholder requirements
- New feature ideas from any perspective
- Capturing context before formal specification

**Input Perspectives** (can be one or more):

| Perspective | Examples | Typical Artifacts |
|-------------|----------|-------------------|
| **UX/Design** | Wireframes, user flows, mockups, journey maps | Screenshots, Figma links, user stories |
| **Process** | Business workflows, approval chains, integrations | Flow diagrams, BPMN, sequence descriptions |
| **Data** | Data models, schemas, migration needs | ERDs, sample payloads, data dictionaries |
| **Domain** | Business rules, terminology, constraints | Glossaries, rule descriptions, edge cases |
| **Architecture** | System diagrams, integration points, NFRs | C4 diagrams, component sketches, constraints |
| **Idea** | Rough concepts, "what if" explorations | Notes, sketches, voice memos transcribed |

**Artifacts produced**:
```
_brief/
├── initial-requirements.md        # Stakeholder requirements
├── ux-wireframes-2025-01-15.md   # Design perspective
├── data-model-notes.md            # Data perspective
├── integration-requirements.md    # Architecture perspective
└── stakeholder-meeting-notes.md   # Raw capture
```

**Key characteristics**:
- **Unstructured is OK** - Briefs capture raw inputs; structure comes in `/specify`
- **Multi-modal** - Text, images, diagrams, links to external tools
- **Additive** - Multiple briefs can feed into a single specification
- **Traceable** - Specifications reference their source briefs

**Quality gate**: Brief exists and captures enough context to proceed to research or specification.

**Next step**:
- If technical decisions needed → `/problem`
- If requirements clear → `/specify`

---

### `/problem` - Research & Analyze

**Purpose**: Investigate technical challenges, evaluate options, analyze tradeoffs.

**Input**: Problem description or technical question

**Output**: Research document in `_research/YYYY-MM-DD-topic.md`

**When to use**:
- Facing architectural decisions
- Evaluating technology options
- Need structured analysis before specifying

**Artifacts produced**:
```
_research/2025-01-15-caching-strategy-evaluation.md
```

**Key sections**:
- Problem statement and constraints
- Solution options (3-5 alternatives)
- Tradeoff analysis matrix
- Recommendation with rationale

**Next step**: Use `/adr` to record the decision once approved.

---

### `/adr` - Record Decision

**Purpose**: Create formal Architecture Decision Record from research or standalone decision.

**Input**:
- Research document (recommended): `--from _research/YYYY-MM-DD-topic.md`
- Or standalone decision statement

**Output**: ADR in `_adr/NNNN-decision-title.md`

**When to use**:
- After `/problem` research is reviewed and decision approved
- When making architectural decisions that should be recorded
- When superseding a previous decision

**Artifacts produced**:
```
_adr/0005-use-redis-for-caching.md
```

**Key sections**:
- Context and problem statement
- Decision statement
- Rationale and alternatives considered
- Consequences (positive, negative, neutral)

**Command options**:
```bash
/adr --from _research/2025-01-15-caching.md           # From research
/adr --from _research/2025-01-15-caching.md --option 2  # Specific option
/adr "Use PostgreSQL for persistence"                  # Standalone
/adr "Migrate to Valkey" --supersedes 0005            # Superseding
```

---

### `/specify` - Define Requirements

**Purpose**: Create comprehensive, unambiguous feature specifications.

**Input**: Feature description or reference to existing code/requirements

**Output**: Specification in `_specification/feature-name.md`

**When to use**:
- Starting a new feature
- Refactoring existing code
- Converting prototypes to production

**Artifacts produced**:
```
_specification/user-authentication.md
```

**Key sections**:
- User stories and workflows
- Functional requirements
- Component model
- Test strategy
- Success criteria

---

### `/plan-feature` - Phase the Work

**Purpose**: Create phased implementation plan with stage gates.

**Input**: Specification from `_specification/`

**Output**: Plan in `_plans/feature-name-implementation-plan.md`

**When to use**:
- After specification is complete
- Complex features requiring multiple phases
- Team coordination needed

**Artifacts produced**:
```
_plans/user-authentication-implementation-plan.md
```

**Key sections**:
- Phased breakdown
- Deliverables per phase
- Quality gates
- Traceability to specification

**Architecture Pattern Reference**: During planning, reference `_templates/architecture-patterns.md` to ensure structural alignment with established patterns.

**Note**: Named `/plan-feature` to avoid conflicts with built-in planning modes.

---

### `/implement` - Execute with Quality

**Purpose**: Implement features following the plan with comprehensive documentation.

**Input**: Plan from `_plans/`

**Output**:
- Source code in `src/`
- Progress logs in `_progress/`

**When to use**:
- Ready to write code
- Following established plan
- Need quality enforcement

**Artifacts produced**:
```
src/domain/entities/user.py
src/application/use_cases/authenticate_user.py
_progress/20250115-1430-phase-1-domain-entities.md
```

**Architecture Pattern Reference**: Implementation must follow patterns defined in `_templates/architecture-patterns.md`:
- Hexagonal Architecture (Ports & Adapters)
- Configurator Port Pattern
- Self-Registering Adapter Registry
- Temporal Workflows vs Use Cases
- Event-Driven Async Workflow Architecture
- Polymorphic Event Pattern

---

### `/ddd` - Document Domain (Developer Onboarding)

**Purpose**: Generate/update comprehensive domain documentation for developer onboarding and knowledge transfer.

**Input**: Existing codebase

**Output**: Documentation in `_domain/`

**When to use**:
- **After feature completion** - Document new domain concepts
- **Onboarding new developers** - Generate up-to-date overview
- **Domain review** - Validate naming consistency
- **Architecture enforcement** - Check Ports & Adapters compliance
- **Periodic refresh** - Keep docs synchronized with code

**Artifacts produced**:
```
_domain/
├── readme.md                # Navigation guide
├── domain-model.md          # Complete DDD model
├── ubiquitous-language.md   # Glossary of terms (A-Z)
├── bounded-contexts.md      # Context boundaries and integration
├── architecture.md          # Ports & Adapters structure
└── archive/                 # Previous versions
    └── domain-model-v1.0.0.md
```

**What it generates**:
- **Executive Summary** - High-level overview of the domain
- **Bounded Contexts** - Logical boundaries in the system
- **Entities & Value Objects** - Core domain concepts
- **Aggregates** - Consistency boundaries
- **Domain Services** - Stateless business logic
- **Use Cases** - Application workflows
- **Ports & Adapters** - Architecture layer mapping
- **Ubiquitous Language** - Glossary with definitions
- **State Transitions** - Entity lifecycle diagrams
- **Evolution History** - How domain has changed

---

## Architecture Patterns Integration

Implementation consistency is achieved through reusable architecture patterns documented in `_templates/architecture-patterns.md`.

### Pattern Catalog

| Pattern | Purpose | When to Apply |
|---------|---------|---------------|
| **Hexagonal Architecture** | Isolate business logic from infrastructure | All features |
| **Configurator Port Pattern** | Wire dependencies for different contexts | Worker/API/Test setup |
| **Self-Registering Registry** | Add adapters without modifying existing code | New adapter implementations |
| **Temporal Workflows vs Use Cases** | Choose sync vs async orchestration | Feature planning |
| **Event-Driven Async Architecture** | Coordinate UI/API/Worker across processes | Real-time features |
| **Polymorphic Event Pattern** | Type-safe event handling with registry | Event streaming |
| **Composite Adapter Pattern** | Multiple adapters for same port | Logging + production |
| **DTO Boundary Crossing** | Decouple layers via transfer objects | API boundaries |

### Pattern Application by Phase

| Phase | Patterns to Reference |
|-------|----------------------|
| `/problem` | All patterns (for option evaluation) |
| `/adr` | Relevant pattern constraints |
| `/specify` | Component structure from Hexagonal |
| `/plan-feature` | Layer breakdown, Workflows vs Use Cases |
| `/implement` | All implementation patterns |
| `/ddd` | Architecture documentation patterns |

### Anti-Patterns to Avoid

Reference `_templates/architecture-patterns.md` → "Architecture Anti-Patterns" section:
- Domain importing infrastructure
- Application using concrete adapters
- Workflows with I/O operations
- Missing port abstractions

---

## Quality Gates

Each phase has explicit quality gates that must pass before proceeding.

### Brief Phase
- [ ] Input captured from relevant perspectives (UX, Process, Data, Domain, Architecture)
- [ ] Source/stakeholder identified
- [ ] Context sufficient to understand the need
- [ ] Stored in `_brief/` with descriptive filename

### Research Phase (`/problem`)
- [ ] Problem clearly stated with constraints
- [ ] 3+ solution options evaluated
- [ ] Tradeoffs analyzed objectively
- [ ] Recommendation provided with rationale

### Decision Phase (`/adr`)
- [ ] Context captures why decision was needed
- [ ] Decision statement is unambiguous
- [ ] Alternatives documented with rejection reasons
- [ ] Consequences (positive and negative) listed

### Specification Phase (`/specify`)
- [ ] User stories cover all use cases
- [ ] Requirements are testable
- [ ] Component model aligns with architecture patterns
- [ ] Success criteria are measurable

### Planning Phase (`/plan-feature`)
- [ ] Phases have clear deliverables
- [ ] Quality gates defined per phase
- [ ] Traceability to specification maintained
- [ ] Architecture patterns identified for implementation

### Implementation Phase (`/implement`)
- [ ] Code follows architecture patterns
- [ ] Tests written for new code
- [ ] Progress logs updated
- [ ] Quality commands pass (lint, test, type-check)

### Documentation Phase (`/ddd`)
- [ ] Domain model reflects current code
- [ ] Ubiquitous language matches code naming
- [ ] Architecture diagram is accurate
- [ ] Onboarding flow is clear

---

## Documentation Workflow

### Keeping Documentation Current

Documentation is a **continuous process**, not a one-time task.

**Documentation Triggers**:

| Trigger | Action | Command |
|---------|--------|---------|
| New feature completed | Update domain model | `/ddd` |
| Facing technical decision | Research options | `/problem` |
| Decision approved | Record in ADR | `/adr` |
| New developer joining | Regenerate docs | `/ddd` |
| Breaking domain change | Archive + regenerate | `/ddd --compare` |
| Quarterly review | Refresh all docs | `/ddd` |

### Documentation Quality Checklist

Before considering documentation complete:

- [ ] `_domain/` reflects current codebase
- [ ] Ubiquitous language matches code naming
- [ ] Architecture diagram is accurate
- [ ] ADRs exist for key decisions
- [ ] README explains how to navigate
- [ ] Progress logs are up to date

---

## Adoption Guide

### Minimal Setup (Any Project)

Create these to enable basic workflow:

```bash
mkdir -p _specification _plans _progress _templates .claude/commands
touch CLAUDE.md
```

**CLAUDE.md minimum content**:
```markdown
# CLAUDE.md

## Project: [Name]
[One paragraph description]

## Tech Stack
- Language: [e.g., Python 3.11]
- Framework: [e.g., FastAPI]
- Database: [e.g., PostgreSQL]

## Quality Commands
- Lint: `[command]`
- Test: `[command]`
- Type check: `[command]`

## Directory Structure
[Describe where code goes]

## Architecture
See `_templates/architecture-patterns.md` for implementation patterns.
```

### Full Setup (Recommended)

```bash
# Create all blueprint directories
mkdir -p _adr _brief _docs _plans _progress _research _specification _templates

# For DDD projects
mkdir -p _domain

# Claude Code commands
mkdir -p .claude/commands

# Create CLAUDE.md
touch CLAUDE.md

# Copy architecture patterns template
cp /path/to/architecture-patterns.md _templates/
```

### Adopting in Existing Project

1. **Create `CLAUDE.md`** - Document existing conventions
2. **Create `_templates/architecture-patterns.md`** - Define or adopt patterns
3. **Create `_specification/`** - Start specifying new features
4. **Create `_plans/`** - Plan before implementing
5. **Create `_progress/`** - Track implementation progress
6. **Migrate ADRs to `_adr/`** - If you have existing decisions documented elsewhere

---

## Benefits

### For Coding Agents

- **Predictable discovery**: Know exactly where to find project guidance
- **Clear workflow**: Understand what phase of work we're in
- **Quality enforcement**: Discover validation commands automatically
- **Traceability**: Link requirements → specs → plans → code → tests
- **Pattern guidance**: Reference architecture patterns during implementation

### For Developers

- **Consistent structure**: Same patterns across all projects
- **Documentation as workflow**: Documentation created as natural part of work
- **Decision history**: ADRs capture why, not just what
- **Onboarding**: New team members find everything in expected places
- **Architecture consistency**: Patterns ensure uniform implementation

### For Teams

- **Shared understanding**: Everyone knows where things go
- **Review efficiency**: Reviewers know what to expect
- **Knowledge preservation**: Context captured, not lost
- **Quality gates**: Explicit checkpoints prevent shortcuts
- **Technical debt prevention**: Consistent patterns reduce drift

---

## Customization

The convention is a **starting point**, not a straitjacket.

### Optional Directories

- `_domain/` - Only needed for DDD projects
- `_brief/` - Can be omitted if requirements come from external tools
- `_research/` - Can merge with `_adr/` if preferred

### Additional Directories

Add project-specific directories as needed:
- `_migrations/` - Database migration documentation
- `_api/` - API documentation
- `_runbooks/` - Operational runbooks

### Command Customization

Modify `.claude/commands/*.md` to match your workflow:
- Add project-specific quality checks
- Customize templates for your tech stack
- Add domain-specific commands

### Architecture Pattern Customization

Extend `_templates/architecture-patterns.md` with:
- Project-specific patterns
- Technology-specific adapters
- Custom quality checklists

---

## Related Documents

| Document | Location | Purpose |
|----------|----------|---------|
| Architecture Patterns | `_templates/architecture-patterns.md` | Implementation patterns and anti-patterns |
| Plan Phase Template | `_templates/plan-phase-template.md` | Detailed template for plan phases |
| Progress Template | `_templates/progress-template.md` | Template for progress logs |
| ADR Conventions | `_adr/README.md` | ADR format and conventions |
| Command Documentation | `.claude/commands/README.md` | Detailed command usage |
