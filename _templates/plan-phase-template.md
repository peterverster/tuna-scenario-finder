# Plan Phase Template

Use this template for each phase in an implementation plan.

---

## Phase Template

```markdown
## Phase [N]: [Phase Name]

**Duration**: [Estimated duration or "Variable"]
**Prerequisites**: [What must be complete before starting]

### Overview

[1-2 sentence description of what this phase accomplishes]

---

### [N.1] [Sub-task Name]

**Specification Reference**: `_specification/[spec-name].md#[section]`

**Objective**: [What this sub-task achieves]

#### Tasks

1. [ ] [Concrete task with expected outcome]
2. [ ] [Another task]
3. [ ] [...]

#### Commands

```bash
# Setup/preparation commands
[command]

# Implementation commands
[command]

# Verification commands
[command]
```

#### Deliverables

| File | Description |
|------|-------------|
| `[path/to/file]` | [What it contains/does] |
| `[path/to/test]` | [What it tests] |

#### Code Pattern

[Brief example showing the expected pattern - optional but helpful]

```[language]
# Example showing expected structure
[code example]
```

#### Quality Gates

- [ ] {quality_command} passes
- [ ] {test_command} passes for new code
- [ ] No {forbidden_pattern} usage
- [ ] [Domain-specific check]

---

### [N.2] [Next Sub-task Name]

[Repeat structure...]

---

### Phase [N] Completion Checklist

#### Deliverables Complete

- [ ] All sub-task deliverables created
- [ ] All files in expected locations
- [ ] No placeholder or TODO comments

#### Quality Gate (MUST PASS)

- [ ] `make quality` passes (format + lint + typecheck + security)
- [ ] `make test` passes for new code
- [ ] Coverage ≥ {coverage_target}% for new code

#### Git Commit & Tag

- [ ] Changes committed with conventional message: `feat({scope}): complete phase [N] - {description}`
- [ ] Phase tagged: `v{version}-{abbrev}-phase[N]-{name}`
- [ ] Tag pushed: `git push --tags`

#### Documentation Updated

- [ ] Progress log created: `_progress/[date]-phase-[N]-[name].md`
- [ ] Any new patterns documented
- [ ] README updated (if public API changed)

#### Stage Gate Validation

```bash
# Run these commands to validate phase completion (IN ORDER)

# 1. Quality gate (MUST PASS before proceeding)
make quality

# 2. Tests
make test

# 3. Commit (only after quality passes)
git add -A
git commit -m "feat({scope}): complete phase [N] - {description}"

# 4. Tag (only after commit succeeds)
git tag -a v{version}-{abbrev}-phase[N]-{name} -m "Phase [N]: {Name}"

# 5. Push
git push && git push --tags
```

**⚠️ DO NOT proceed to Phase [N+1] until quality gate passes and phase is tagged.**

---

## Phase Types

Different phases have different focuses. Use these as starting points:

### Foundation Phase

**Focus**: Setup, configuration, interfaces

```markdown
## Phase 1: Foundation

### 1.1 Project Setup
- Configure dependencies
- Set up development environment
- Create configuration structure

### 1.2 Interface Definition
- Define port interfaces (if Ports & Adapters)
- Define API contracts
- Define data schemas

### 1.3 Test Infrastructure
- Set up test framework
- Create test fixtures
- Verify CI pipeline
```

### Domain/Core Phase

**Focus**: Business logic, entities, rules

```markdown
## Phase 2: Domain Implementation

### 2.1 Entities & Value Objects
- Create domain entities
- Create value objects
- Enforce invariants in constructors

### 2.2 Domain Services
- Implement business rules
- Create domain operations
- Unit test all paths

### 2.3 Domain Events (if applicable)
- Define event types
- Implement event emission
- Test event generation
```

### Application Phase

**Focus**: Use cases, orchestration

```markdown
## Phase 3: Application Layer

### 3.1 Use Case Implementation
- Create use case classes
- Inject port dependencies
- Handle errors at boundaries

### 3.2 Application Services
- Implement cross-cutting concerns
- Add logging/monitoring hooks
- Unit test with mocked ports
```

### Infrastructure Phase

**Focus**: Adapters, external integrations

```markdown
## Phase 4: Infrastructure

### 4.1 Persistence Adapters
- Implement repository adapters
- Create database migrations
- Integration test with real database

### 4.2 External Service Adapters
- Implement API clients
- Handle retries and timeouts
- Integration test (or mock external services)

### 4.3 API/UI Layer
- Implement endpoints/routes
- Wire dependency injection
- E2E test happy paths
```

### Validation Phase

**Focus**: End-to-end verification

```markdown
## Phase 5: Validation & Polish

### 5.1 End-to-End Testing
- Test complete workflows
- Test error scenarios
- Test edge cases

### 5.2 Performance Validation
- Profile critical paths
- Optimize if needed
- Document performance characteristics

### 5.3 Documentation
- Update README
- Add usage examples
- Document configuration
```

---

## Traceability Section

Include a traceability matrix in the plan:

```markdown
## Traceability Matrix

| Requirement | Spec Section | Phase | Implementation | Test |
|-------------|--------------|-------|----------------|------|
| [REQ-001] User can login | `_specification/auth.md#login` | 2.1 | `src/auth/login.py` | `tests/test_login.py` |
| [REQ-002] Failed login shows error | `_specification/auth.md#errors` | 2.2 | `src/auth/login.py:45` | `tests/test_login.py:test_error` |
```

---

## Progress Integration

After completing each phase, create a progress document:

**File**: `_progress/YYYYMMDD-HHMM-phase-[N]-[name].md`

**Content**: Use `_templates/progress-template.md`

---

## Git Integration

### MANDATORY: Quality Gate Before Commit

**Quality gates MUST pass before committing and tagging any phase.**

```bash
# 1. Run quality gate (MUST PASS - non-negotiable)
make quality   # Includes: format, lint, typecheck, security scan

# If quality fails:
#   - DO NOT commit or tag
#   - Fix all issues first
#   - Re-run until it passes
```

### Phase Completion Protocol

After quality gates pass:

```bash
# 2. Run tests for the phase
make test      # Or: pytest, npm test, etc.

# 3. Stage all changes
git add -A

# 4. Commit with conventional format
git commit -m "feat({scope}): complete phase {N} - {description}

- [Deliverable 1]
- [Deliverable 2]
- Tests: {N} tests, {X}% coverage

Refs: _specification/{spec-name}.md"

# 5. Create annotated tag (REQUIRED for phase completion)
git tag -a v{version}-{abbrev}-phase{N}-{name} -m "Phase {N}: {Name} complete

Quality gates passed:
- make quality ✓
- make test ✓

Deliverables:
- {file1}
- {file2}"

# 6. Push commit and tag
git push && git push --tags
```

### Tag Naming Convention

**Format**: `v{major}.{minor}.{patch}-{feature-abbrev}-phase{N}-{phase-name}`

| Component | Description | Example |
|-----------|-------------|---------|
| `version` | Semantic version | `0.1.0` |
| `abbrev` | 2-4 letter feature abbreviation | `msc`, `auth` |
| `phase{N}` | Phase number | `phase1`, `phase2` |
| `name` | Kebab-case phase name | `foundation`, `domain` |

**Examples**:
```
v0.1.0-msc-phase1-foundation
v0.1.0-msc-phase2-domain
v0.1.0-auth-phase3-infrastructure
```

---

## Quality Gate Discovery

The plan command should discover quality commands from your project:

| Source | Look For |
|--------|----------|
| `Makefile` | `quality`, `lint`, `test`, `check` targets |
| `package.json` | `scripts.test`, `scripts.lint`, `scripts.build` |
| `pyproject.toml` | `[tool.pytest]`, `[tool.ruff]`, `[tool.mypy]` |
| `.github/workflows/` | Validation steps in CI |
| `CLAUDE.md` | Explicit quality commands section |

**Use discovered commands** in quality gates rather than hardcoding.

---

## Tips

### Keep Phases Focused

Each phase should:
- Have a clear theme (foundation, domain, infrastructure, validation)
- Be completable in a reasonable time
- Have verifiable deliverables
- End with a working (if partial) system

### Don't Skip Quality Gates

**Quality gates are NON-NEGOTIABLE.** Never commit or tag until `make quality` passes.

Quality gates exist because:
- Problems compound when not caught early
- Later phases assume earlier phases are solid
- Refactoring mid-implementation is expensive
- Tags represent verified, quality-assured milestones

**If quality fails**: Fix issues immediately. Do not proceed.

### Track Progress Actively

Create progress documents because:
- They capture what actually happened (vs. plan)
- They document decisions made during implementation
- They help resume after interruptions
- They provide history for retrospectives
