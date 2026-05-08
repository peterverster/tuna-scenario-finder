# Temporal Activity Errors Report

**Generated**: 2025-12-25T06:42:32.309990+00:00
**Time Window**: Last 30 minutes
**Workflows Scanned**: 48
**Workflows with Errors**: 1

## Error Summary by Pattern

### Pattern: `message: "activity StartToClose timeout"
source: "Server"
cause {
  message: "activity StartToClose `

**Count**: 1

| Workflow ID | Workflow Type | Error Type |
|-------------|---------------|------------|
| `content-ingestion-8fadabbd-c49a-4541-9e7...` | ContentIngestionWorkflow | activity_timeout |

### Pattern: `Activity task timed out`

**Count**: 1

| Workflow ID | Workflow Type | Error Type |
|-------------|---------------|------------|
| `content-ingestion-8fadabbd-c49a-4541-9e7...` | ContentIngestionWorkflow | workflow_failed |

## Detailed Errors

### Workflow: `content-ingestion-8fadabbd-c49a-4541-9e7b-5eea095e95ce`

- **Type**: ContentIngestionWorkflow
- **Status**: FAILED
- **Start Time**: 2025-12-25T06:33:37.966566+00:00

#### Error 1: activity_timeout

**Message**: message: "activity StartToClose timeout"
source: "Server"
cause {
  message: "activity StartToClose timeout"
  source: "Server"
  timeout_failure_info {
    timeout_type: TIMEOUT_TYPE_START_TO_CLOSE
  }
}
timeout_failure_info {
  timeout_type: TIMEOUT_TYPE_START_TO_CLOSE
}


#### Error 2: workflow_failed

**Message**: Activity task timed out

---

