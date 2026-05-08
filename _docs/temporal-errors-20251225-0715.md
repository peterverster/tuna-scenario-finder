# Temporal Activity Errors Report

**Generated**: 2025-12-25T07:15:01.799384+00:00
**Time Window**: Last 10 minutes
**Workflows Scanned**: 48
**Workflows with Errors**: 20

## Error Summary by Pattern

### Pattern: `Elasticsearch bulk indexing failed: Connection timed out`

**Count**: 10

| Workflow ID | Workflow Type | Error Type |
|-------------|---------------|------------|
| `dew-4c136d73-4fc9141a...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-c0f9cdda-6b13bf09...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-19af2aa8-5485ed26...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-500bdd74-e2041be2...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-3323d3d8-68792900...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-0cc54949-d75f2db1...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-9118dc43-5b656d38...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-84996af0-5ed6879f...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-89f06bb6-cb2cd092...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-2024112c-2651467a...` | DocumentEmbeddingWorkflow | activity_failed |

### Pattern: `Failed to build hierarchy: ImageLeaf url cannot be empty`

**Count**: 10

| Workflow ID | Workflow Type | Error Type |
|-------------|---------------|------------|
| `dew-579993c8-d74476b4...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-d114599d-026a876b...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-d716aae4-d8e80c5a...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-5a794f46-1212b6cb...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-0d2b7b25-fbb698fd...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-a5f47e54-78292283...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-7241d248-239ca871...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-488ab701-53e500ea...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-33eda51a-2c207715...` | DocumentEmbeddingWorkflow | activity_failed |
| `dew-cf6b2a6a-4d2b081e...` | DocumentEmbeddingWorkflow | activity_failed |

## Detailed Errors

### Workflow: `dew-4c136d73-4fc9141a`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.973553+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-c0f9cdda-6b13bf09`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:16.010156+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-19af2aa8-5485ed26`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.967138+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-500bdd74-e2041be2`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.795098+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-3323d3d8-68792900`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.866292+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-0cc54949-d75f2db1`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.757853+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-9118dc43-5b656d38`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.973815+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-84996af0-5ed6879f`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:16.122260+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-89f06bb6-cb2cd092`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.646705+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-2024112c-2651467a`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.645740+00:00

#### Error 1: activity_failed

**Message**: Elasticsearch bulk indexing failed: Connection timed out

**Cause**: Connection timed out

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 641, in index_embeddings_activity
    indexed_count = await deps.embedding_indexer.index(
                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    ...<2 lines>...
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/elasticsearch_embedding_indexer.py", line 258, in index
    raise EmbeddingIndexingError(
    ...<2 lines>...
    ) from e

```

---

### Workflow: `dew-579993c8-d74476b4`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:16.192962+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

### Workflow: `dew-d114599d-026a876b`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:16.122505+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

### Workflow: `dew-d716aae4-d8e80c5a`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.794594+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

### Workflow: `dew-5a794f46-1212b6cb`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.830824+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

### Workflow: `dew-0d2b7b25-fbb698fd`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.829807+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

### Workflow: `dew-a5f47e54-78292283`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.867055+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

### Workflow: `dew-7241d248-239ca871`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.758914+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

### Workflow: `dew-488ab701-53e500ea`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.721279+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

### Workflow: `dew-33eda51a-2c207715`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.719746+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

### Workflow: `dew-cf6b2a6a-4d2b081e`

- **Type**: DocumentEmbeddingWorkflow
- **Status**: COMPLETED
- **Start Time**: 2025-12-25T07:12:15.681562+00:00

#### Error 1: activity_failed

**Message**: Failed to build hierarchy: ImageLeaf url cannot be empty

**Cause**: ImageLeaf url cannot be empty

**Stack Trace**:
```
  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 319, in _handle_start_activity_task
    result = await self._execute_activity(
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        start, running_activity, task_token, data_converter
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 631, in _execute_activity
    return await impl.execute_activity(input)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/.venv/lib/python3.13/site-packages/temporalio/worker/_activity.py", line 826, in execute_activity
    return await input.fn(*input.args)
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^

  File "/Users/pv/Repos/blackswans/src/application/activities/document_embedding_activities.py", line 260, in build_hierarchy_activity
    all_nodes, root = deps.hierarchy_builder.build(
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        leaves=leaves,
        ^^^^^^^^^^^^^^
        text=content,
        ^^^^^^^^^^^^^
        doc_id=doc_id,
        ^^^^^^^^^^^^^^
    )
    ^

  File "/Users/pv/Repos/blackswans/src/infrastructure/adapters/parsing/markdown_hierarchy_builder.py", line 163, in build
    raise HierarchyBuildingError(f"Failed to build hierarchy: {e}") from e

```

---

