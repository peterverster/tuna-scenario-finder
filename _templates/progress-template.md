# Progress Document Template

Use this template to document progress after completing work phases.

---

## File Naming

```
_progress/YYYYMMDD-HHMM-[description].md
```

**Examples**:
```
_progress/20250115-1430-phase-1-foundation-complete.md
_progress/20250116-0900-auth-service-implementation.md
_progress/20250117-1600-bug-fix-login-validation.md
```

---

## Template

```markdown
# [Description] - Progress Report

**Date**: YYYY-MM-DD HH:MM
**Phase**: [Phase N.M from plan, or "Ad-hoc" if not following plan]
**Plan Reference**: `_plans/[plan-name].md` (if applicable)
**Status**: Complete | In Progress | Blocked

---

## Summary

[1-2 sentence summary of what was accomplished]

---

## What Was Done

### [Sub-section if needed]

- [Concrete accomplishment 1]
- [Concrete accomplishment 2]
- [...]

### [Another sub-section if needed]

- [...]

---

## Deliverables

| File | Description | Status |
|------|-------------|--------|
| `[path/to/file]` | [What it does] | Created / Modified / Deleted |
| `[path/to/test]` | [What it tests] | Created |

---

## Quality Verification

| Check | Result | Notes |
|-------|--------|-------|
| `{quality_command}` | Pass / Fail | [Any notes] |
| `{test_command}` | Pass / Fail | [X] tests, [Y]% coverage |
| [Other check] | Pass / Fail | [Notes] |

---

## Decisions Made

### [Decision 1]

**Context**: [Why decision was needed]

**Decision**: [What was decided]

**Rationale**: [Why this choice]

**ADR**: `_adr/NNNN-[title].md` (if significant enough for ADR)

---

## Issues Encountered

### [Issue 1]

**Problem**: [What went wrong]

**Resolution**: [How it was fixed]

**Time Impact**: [None / Minor / Significant]

---

## Deviations from Plan

[If following a plan, note any deviations]

| Planned | Actual | Reason |
|---------|--------|--------|
| [What was planned] | [What happened] | [Why different] |

---

## Next Steps

- [ ] [Immediate next task]
- [ ] [Following task]
- [ ] [...]

**Blockers**: [None, or describe what's blocking progress]

---

## Time Tracking (Optional)

| Activity | Time Spent |
|----------|------------|
| Implementation | [X hours] |
| Testing | [X hours] |
| Documentation | [X hours] |
| Debugging | [X hours] |
| **Total** | **[X hours]** |

---

## References

- Plan: `_plans/[plan-name].md`
- Specification: `_specification/[spec-name].md`
- Related Progress: `_progress/[related].md`
- Commits: [commit range or PR link]
```

---

## Short Form Template

For quick updates or small changes:

```markdown
# [Description] - Progress

**Date**: YYYY-MM-DD HH:MM
**Status**: Complete

## Done

- [What was accomplished]

## Deliverables

- `[file]` - [description]

## Quality

- `{quality_command}`: Pass
- `{test_command}`: Pass ([X] tests)

## Next

- [What's next]
```

---

## When to Create Progress Documents

### Always Create When

- Completing a phase from a plan
- Finishing a significant feature or component
- Resolving a complex bug
- Making architectural changes
- Before taking a break from work (captures state for resumption)

### Optional

- Small bug fixes
- Documentation-only changes
- Routine maintenance

### Skip When

- Trivial changes (typo fixes, formatting)
- Exploratory work (use `_research/` instead)
- Work that will be documented elsewhere (commit messages sufficient)

---

## Tips

### Be Concrete

Bad: "Made progress on authentication"
Good: "Implemented login endpoint with JWT token generation"

### Track Decisions

Even small decisions matter later:
- "Used bcrypt over argon2 because already in dependencies"
- "Chose 15-minute token expiry based on security requirements"

### Note Blockers Early

Don't wait until standup - document blockers when you hit them:
- What's blocked
- What's needed to unblock
- Who can help

### Link Related Documents

Progress documents are part of a chain:
```
Plan → Progress 1 → Progress 2 → ... → Final Progress
```

Cross-reference to maintain traceability.

---

## Example Progress Document

```markdown
# Phase 2 Domain Implementation - Progress

**Date**: 2025-01-15 14:30
**Phase**: 2.1 (Entities & Value Objects)
**Plan Reference**: `_plans/user-auth-implementation-plan.md`
**Status**: Complete

---

## Summary

Implemented core domain entities for user authentication including User entity,
Email and Password value objects, and AuthenticationResult.

---

## What Was Done

### Domain Entities

- Created `User` entity with identity, email, hashed password
- Enforced invariant: email must be valid format
- Enforced invariant: password must meet complexity requirements

### Value Objects

- Created `Email` value object with validation
- Created `Password` value object with hashing
- Created `AuthenticationResult` for login outcomes

---

## Deliverables

| File | Description | Status |
|------|-------------|--------|
| `src/domain/entities/user.py` | User entity | Created |
| `src/domain/value_objects/email.py` | Email VO | Created |
| `src/domain/value_objects/password.py` | Password VO | Created |
| `tests/unit/domain/test_user.py` | User tests | Created |
| `tests/unit/domain/test_value_objects.py` | VO tests | Created |

---

## Quality Verification

| Check | Result | Notes |
|-------|--------|-------|
| `make quality` | Pass | - |
| `pytest tests/unit/domain/` | Pass | 24 tests, 98% coverage |
| `mypy src/domain/` | Pass | No errors |

---

## Decisions Made

### Password Hashing Algorithm

**Context**: Need to hash passwords securely

**Decision**: Use bcrypt with cost factor 12

**Rationale**: Industry standard, already in dependencies, cost factor 12
balances security with performance

---

## Issues Encountered

### Email Validation Regex

**Problem**: Initial regex rejected valid emails with + character

**Resolution**: Switched to `email-validator` library instead of custom regex

**Time Impact**: Minor (30 minutes)

---

## Next Steps

- [ ] Implement UserRepository port interface (Phase 2.2)
- [ ] Create authentication domain service
- [ ] Add domain events for login success/failure

**Blockers**: None

---

## References

- Plan: `_plans/user-auth-implementation-plan.md`
- Specification: `_specification/user-authentication.md`
- Commit: abc123f
```
