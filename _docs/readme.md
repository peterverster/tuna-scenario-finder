# Documentation Directory

This directory contains general project documentation for BlackSwans.ai.

---

## Directory Purpose

**`_docs/`** contains operational and setup documentation that is NOT domain-specific:

- Database setup and configuration guides
- Deployment procedures and infrastructure guides
- Development environment setup
- Tool-specific setup instructions (PGMac, Docker, etc.)
- Operational runbooks and troubleshooting guides

---

## Documentation Structure

### This Directory (`_docs/`)
General project documentation - setup, deployment, operations

**Current files**:
- `development-setup.md` - **START HERE** - Complete developer onboarding guide
- `configuration-guide.md` - TOML configuration and secrets management
- `database-quickstart.md` - Quick database setup guide (5 minutes)
- `database-setup.md` - Comprehensive database setup documentation
- `deployment.md` - Deployment procedures and infrastructure
- `pgmac-setup.md` - Postgres.app specific setup for macOS
- `testing-strategy.md` - Test conventions and patterns
- `toml-configuration-management.md` - Technical config specification
- `configurator-port-pattern-guide.md` - Dependency injection architecture

### Other Documentation Directories

- **`_domain/`** - Domain-Driven Design documentation
  - Domain model, ubiquitous language, bounded contexts
  - Architecture (Ports & Adapters)
  - Domain-specific database schema patterns

- **`_brief/`** - Project briefs and requirements
  - Initial project requirements
  - Research notes and literature
  - Problem statements

- **`_research/`** - Architecture Decision Records (ADRs)
  - Technical investigations
  - Technology evaluations
  - Decision rationales

- **`_specification/`** - Technical specifications
  - API contracts
  - Data schemas
  - Integration specifications

- **`_progress/`** - Development progress logs
  - Session notes
  - Implementation milestones
  - Feature completion tracking

---

## File Naming Convention

**⚠️ MANDATORY: Use kebab-case for all files**

**Correct**:
```
database-setup.md
pgmac-setup.md
deployment-guide.md
troubleshooting-elasticsearch.md
```

**Incorrect**:
```
DatabaseSetup.md          # ❌ PascalCase
database_setup.md         # ❌ snake_case
DATABASE-SETUP.md         # ❌ SCREAMING-KEBAB
```

**Rationale**: Kebab-case is web-friendly, readable, and avoids case-sensitivity issues across filesystems.

---

## Adding New Documentation

When creating new documentation:

1. **Determine the correct directory**:
   - Domain model/architecture? → `_domain/`
   - Setup/deployment/operations? → `_docs/` (this directory)
   - Requirements/briefs? → `_brief/`
   - Technical decisions? → `_research/`
   - Specifications? → `_specification/`

2. **Use kebab-case naming**: `feature-name-guide.md`

3. **Follow this template**:
   ```markdown
   # Title

   Brief description of what this document covers.

   ---

   ## Section 1
   Content...

   ## Section 2
   Content...
   ```

4. **Keep root directory clean**: NEVER place documentation in project root except:
   - `README.md` (main project readme)
   - `CLAUDE.md` (Claude Code instructions)
   - `CONTRIBUTING.md` (contribution guidelines)
   - `LICENSE.md` (project license)

---

## Root Directory Policy

**⚠️ CRITICAL: NO documentation files in root directory**

The project root should only contain:
- Essential project files (`README.md`, `CLAUDE.md`, `LICENSE.md`)
- Configuration files (`.env.example`, `pyproject.toml`, `alembic.ini`)
- Docker files (`Dockerfile`, `docker-compose.yml`)
- CI/CD files (`.github/`, `terraform/`)

All other documentation MUST be in structured directories.

---

## Current Documentation Index

### Getting Started
- [`development-setup.md`](development-setup.md) - **START HERE** - Full developer setup
- [`configuration-guide.md`](configuration-guide.md) - Configuration and secrets

### Database
- [`database-quickstart.md`](database-quickstart.md) - Quick start (5 min setup)
- [`database-setup.md`](database-setup.md) - Comprehensive guide
- [`pgmac-setup.md`](pgmac-setup.md) - Postgres.app for macOS

### Deployment
- [`deployment.md`](deployment.md) - GCP/Azure deployment with Terraform

### Architecture
- [`configurator-port-pattern-guide.md`](configurator-port-pattern-guide.md) - Dependency injection
- [`port-naming-conventions.md`](port-naming-conventions.md) - Port interface patterns
- [`toml-configuration-management.md`](toml-configuration-management.md) - Config system design

### Testing
- [`testing-strategy.md`](testing-strategy.md) - Test patterns and conventions

### Other Documentation
- [`../scripts/README.md`](../scripts/README.md) - Development scripts reference
- [`../config/README.md`](../config/README.md) - Configuration file reference
- [`../_domain/readme.md`](../_domain/readme.md) - Domain model documentation

---

## Maintenance

Keep documentation:
- **Up-to-date**: Update when code changes
- **Accurate**: Verify commands and procedures work
- **Concise**: Focus on essentials, link to external resources
- **Organized**: Use the correct directory for the content type

---

**Last Updated**: 2025-12-17
**Maintained By**: BlackSwans.ai Development Team
