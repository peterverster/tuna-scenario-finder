There are a few approaches depending on what kind of errors you're after. Here's how to do it with the Temporal Python SDK:

## 1. Basic Workflow Status & Failure Info

```python
from temporalio.client import Client

async def check_workflow_status(workflow_id: str):
    client = await Client.connect("localhost:7233")
    
    handle = client.get_workflow_handle(workflow_id)
    
    # Get the workflow description
    desc = await handle.describe()
    
    print(f"Status: {desc.status.name}")
    print(f"Running: {desc.status == WorkflowExecutionStatus.RUNNING}")
    
    # If workflow failed, get the failure details
    if desc.status == WorkflowExecutionStatus.FAILED:
        try:
            await handle.result()
        except Exception as e:
            print(f"Failure reason: {e}")
```

## 2. Get Full History with All Errors (Activity Failures, Retries, etc.)

This is what you likely want for collecting error messages from failed activities:

```python
from temporalio.client import Client

async def collect_workflow_errors(workflow_id: str) -> list[dict]:
    client = await Client.connect("localhost:7233")
    handle = client.get_workflow_handle(workflow_id)
    
    errors = []
    
    async for event in handle.fetch_history_events():
        # Activity task failures
        if event.HasField("activity_task_failed_event_attributes"):
            attrs = event.activity_task_failed_event_attributes
            errors.append({
                "type": "activity_failed",
                "activity_id": attrs.scheduled_event_id,
                "failure": str(attrs.failure),
                "message": attrs.failure.message if attrs.failure else None,
            })
        
        # Workflow execution failures
        if event.HasField("workflow_execution_failed_event_attributes"):
            attrs = event.workflow_execution_failed_event_attributes
            errors.append({
                "type": "workflow_failed",
                "failure": str(attrs.failure),
                "message": attrs.failure.message if attrs.failure else None,
            })
        
        # Activity task timeouts
        if event.HasField("activity_task_timed_out_event_attributes"):
            attrs = event.activity_task_timed_out_event_attributes
            errors.append({
                "type": "activity_timeout",
                "failure": str(attrs.failure) if attrs.failure else "timeout",
            })
    
    return errors
```

## 3. Custom Query Handler (Real-time Progress)

If you want to query progress *while* the workflow is running, define a query handler in your workflow:

```python
from temporalio import workflow
from dataclasses import dataclass, field

@dataclass
class ProgressState:
    completed_steps: list[str] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    current_step: str = ""

@workflow.defn
class MyWorkflow:
    def __init__(self):
        self._progress = ProgressState()

    @workflow.query
    def get_progress(self) -> ProgressState:
        return self._progress

    @workflow.run
    async def run(self, input: str):
        self._progress.current_step = "step_1"
        try:
            await workflow.execute_activity(...)
            self._progress.completed_steps.append("step_1")
        except Exception as e:
            self._progress.errors.append(f"step_1: {str(e)}")
        # ... continue
```

Then query it from outside:

```python
async def query_progress(workflow_id: str):
    client = await Client.connect("localhost:7233")
    handle = client.get_workflow_handle(workflow_id)
    
    progress = await handle.query(MyWorkflow.get_progress)
    print(f"Current: {progress.current_step}")
    print(f"Errors: {progress.errors}")
```

## Quick CLI Check

You can also use the CLI for a quick look:

```bash
temporal workflow show --workflow-id your-workflow-id
```

Which approach fits your use case best — are you trying to monitor in real-time, or inspect after failures occur?