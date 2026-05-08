### Control plane

The **control plane** is the *governance, identity, tenancy, policy, entitlement, and commercial* layer. It answers:

* **Who are you?**
* **What organisation/tenant do you belong to (e.g., ministry organisation)?**
* **What are you allowed to do, and under which service “wave”/tier?**
* **How is access issued, audited, billed, and revoked?**
* **How do we manage configuration and policy safely without touching customer payloads?**

In other words: the control plane is the *front door and admin brain* that manages trust, entitlement, policy distribution, and lifecycle. It should avoid handling heavy customer data beyond what’s required for governance and observability.

### Execution plane

The **execution plane** is the *compute, data-processing, workflow, and AI orchestration* layer. It answers:

* **How do we run the work?**
* **Where do heavy assets live and get processed (video, creative packs)?**
* **How do long-running transactions proceed reliably over time?**
* **How do we coordinate tools/agents/models, enforce compliance rules, and produce outcomes (issues + suggested improvements)?**

In other words: the execution plane is the *factory floor*—it performs the actual analysis/transformation, runs workflows, calls models/tools, moves data, and generates results.

---

## Key “rule of thumb”

* **Control plane = authority and governance of *access, configuration, policy, and commerce***
* **Execution plane = authority and governance of *work, data movement, workflows, and AI outputs***

A good separation is: **control plane should be able to revoke/alter access and policies without needing to inspect or reprocess customer assets**, while **execution plane can continue/resume work using issued credentials/tokens and policy snapshots**.

---

## Capability map (high level)

### 1) Identity, tenancy, and access

**Control plane**

* Tenant/organisation registry (e.g., ministry organisations)
* User identity: login, SSO/OIDC/SAML federation, MFA
* Service-to-service identity and trust bootstrap
* Role-based access control (RBAC) and attribute-based access control (ABAC)
* Service “wave” entitlements (what you have access to by wave/services)
* Token issuance / scoped credentials (short-lived, least-privilege)
* Consent and delegation flows (where relevant)
* Access lifecycle: provisioning, deprovisioning, suspension, offboarding

**Execution plane**

* Consumption of scoped tokens/credentials (no primary auth UI)
* Runtime authorisation checks for each workflow/action (enforced locally)
* Fine-grained runtime permissions (e.g., can this workflow access this asset bucket / model / rule-set)
* Isolation boundaries (per tenant, per project, per workflow run)

---

### 2) Policy and compliance governance

**Control plane**

* Compliance policy administration (global compliance rules catalogue, rule versions)
* Policy packaging and distribution (signed policy bundles pushed/pulled by execution plane)
* Change control: approvals, versioning, rollout strategy (canary, staged waves)
* Policy attestation and auditability (who changed what, when, why)
* Jurisdiction/tenant overlays (ministry-specific constraints)
* Classification schemas (data categories, sensitivity labels)
* Key governance (KMS policy, encryption requirements) — governance *decisions* live here

**Execution plane**

* Policy *enforcement* during workflows (apply rules to assets and outputs)
* Runtime compliance checks (content detection, brand safety, prohibited content, etc.)
* Evidence generation (what checks were executed, what failed, trace to rule version)
* Automated remediation suggestions (issues + improvement guidance)
* Local caching of policy snapshots for long-running workflows (with expiry/refresh rules)

---

### 3) Orchestration and long-running transactions (Temporal workflows)

**Control plane**

* Workflow catalogue/registry (what workflows exist, which tenants can run them)
* Workflow configuration UI/API (parameters, allowed steps, allowed tools/models)
* Quotas and limits (max runs, concurrency, runtime budgets, token budgets)
* Scheduling permissions (who can schedule, pause, cancel)
* Operational governance: maintenance windows, feature flags, rollout controls

**Execution plane**

* Temporal worker execution (activities, retries, backoff, compensation)
* State management for long-running transactions (checkpoints, durable state)
* Temporal I/O construction (your “temporal I/O” streams, intermediate artefacts)
* Workflow coordination across tools/models (fan-out/fan-in, human-in-the-loop steps)
* Idempotency and replay safety for workflows
* Handling heavy asset pipelines (chunking, streaming, transcoding, embeddings, etc.)

---

### 4) Data plane concerns (heavy video + creative assets)

**Control plane**

* Data location policy (allowed regions, data residency constraints)
* Storage account provisioning rules / references (not the assets themselves)
* Data retention policies and legal holds (policy definition + governance)
* Data access governance (who *may* access which buckets/projects)
* Metadata schemas and data catalog definitions (what metadata is captured)

**Execution plane**

* Storage and processing of the actual payloads (video files, creative packs)
* Asset ingestion, validation, transformation (transcode, normalise, extract frames/audio)
* Feature extraction and model input preparation
* Materialisation of intermediate artefacts (thumbnails, embeddings, transcripts)
* Results generation and packaging (issue threads, suggestions, evidence bundles)
* Data lifecycle operations as instructed by policy (expire, archive, redact)

---

### 5) Commercials: payments, billing, entitlements

**Control plane**

* Plans, subscriptions, service tiers, “wave” access rules
* Metering definitions (what counts as usage: token spend, compute minutes, asset GB processed)
* Billing integration, invoicing, payment handling
* Budgeting and spending controls per tenant/project
* Chargeback/showback and cost allocation rules

**Execution plane**

* Emitting usage telemetry (token usage, compute/time, storage, workflow steps)
* Enforcing budgets/quotas at runtime (pause/cancel when budgets exceeded)
* Tagging costs to workflow runs and tenants/projects

---

### 6) Observability, audit, and security operations

**Control plane**

* Admin audit logs (logins, role changes, policy edits, entitlement changes, billing events)
* Security posture management (configuration compliance, baseline controls)
* Key rotation governance and secrets policy
* Tenant-level reporting dashboards (governance view)

**Execution plane**

* Runtime logs (workflow logs, worker logs, task-level traces)
* Distributed tracing across activities and model/tool calls
* Evidence logs for compliance checks (rule IDs, versions, inputs/outputs hashes)
* Runtime incident signals (failed runs, stuck workflows, excessive retries)
* Secure handling of secrets/tokens at runtime (key vault retrieval, rotation consumption)

> Important nuance: you may keep *references* in the control plane (e.g., run IDs, summary status, pointers), but the *bulk evidence and payload* typically stays execution-side.

---

### 7) API surface and user experience

**Control plane**

* Tenant admin portal / ministry admin portal
* Onboarding flows (organisation creation, identity federation setup, wave enablement)
* Governance UI (policies, access, quotas, billing, audit)
* Configuration APIs (register workflows, configure integrations, manage entitlements)

**Execution plane**

* Execution APIs (start run, query run status, fetch results)
* Streaming APIs for long-running processing updates (events, progress)
* Result delivery endpoints (issue threads, suggestions, artefact downloads)
* Integrations for downstream systems (ticketing, DAM, creative tools) *driven by workflow outputs*

---

## A practical mapping for your specific use case

Given your description:

### Execution plane “must-haves”

* Temporal-based workflow engine + workers
* Asset processing pipeline for heavy video/creative assets
* Model/tool orchestration (multi-model, multi-tool, multi-step)
* Global compliance rule enforcement (using versioned rules distributed from control plane)
* Output production:

  * issue threads (structured findings, severity, evidence)
  * suggestions for improvements (actionable remediation)
  * traceability to rule versions and workflow steps

### Control plane “must-haves”

* Ministry organisation login + federation setup
* Service wave entitlement and access management
* Token issuance and scoped authorisation for execution plane actions
* Policy authoring/versioning/approval and distribution controls
* Billing/payments, quotas and budget controls
* Governance-grade audit logs (admin actions, policy changes, access changes)

---

## Boundary decisions that keep the split clean

* **Policy definition vs enforcement**: define/version/approve in control; enforce/generate evidence in execution.
* **Auth UI vs runtime tokens**: login and tenant admin in control; short-lived scoped tokens used in execution.
* **Heavy payload vs pointers**: store/process heavy assets in execution; store pointers, run summaries, and governance metadata in control.
* **Long-running state**: workflow state belongs to execution; control may hold “run registry” and coarse status for admin/reporting.

