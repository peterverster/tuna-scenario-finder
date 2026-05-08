# HIRO Hierarchical Indexing - Quickstart Guide

> ⚠️ **DEPRECATED**: The `HIROIndexingWorkflow` and `BackfillWorkflow` have been
> removed. This documentation describes the original HIRO algorithm concepts which
> are now used for **metadata enrichment** in the Document Embedding Workflow (DEW-001).
>
> For content embedding and search, see: `_specification/document-embedding-workflow.md`

**HIRO** (Hierarchical Indexing for Retrieval Optimization) enables semantic topic discovery across documents using recursive k-means clustering on embeddings.

## What HIRO Does

```
Documents → Chunks → Embeddings → HIRO Hierarchy → Topics
```

HIRO clusters semantically similar content into a hierarchical tree structure, enabling:
- **Cross-document topic discovery** - Find themes spanning multiple articles
- **Semantic navigation** - Browse content by meaning, not keywords
- **Weak signal detection** - Surface emerging patterns across sources

## Architecture

```
                    Root Level (K=12 clusters)
                              │
         ┌────────┬───────────┼───────────┬────────┐
         │        │           │           │        │
        [0]      [3]        [10]        [11]     [...]
       182ch    123ch      108ch       113ch
         │        │           │           │
      ┌──┴──┐  ┌──┴──┐    ┌──┴──┐    ┌──┴──┐
    [0/3]  [...] [3/5]   [10/8]    [11/9]  [...]
    39ch        22ch      19ch      21ch
    11docs      5docs     5docs     10docs
         │
      [0/3/7]    ← Depth 3: Finer topics
         │
       [...]     ← Up to depth 8
```

**Parameters:**
- K = 12 clusters per level
- Depth = 8 levels maximum
- Path example: `[3, 5, 2, 9, 0, 1, 7, 4]`

## Quick Commands

```bash
# Set environment
export APP_ENV=e2e

# 1. Run backfill to index all articles
python scripts/run_backfill.py

# 2. Train HIRO hierarchy on indexed embeddings
python scripts/train_hiro_hierarchy.py train

# 3. View discovered topics
python scripts/train_hiro_hierarchy.py topics

# 4. Check status
python scripts/train_hiro_hierarchy.py status

# 5. Search content
python scripts/index_and_search.py search "AI energy consumption"
```

## Step-by-Step Guide

### 1. Index Content (BackfillWorkflow)

The backfill workflow processes articles from PostgreSQL through the HIRO pipeline:

```bash
# Index all articles with markdown content
APP_ENV=e2e python scripts/run_backfill.py

# Index specific articles
APP_ENV=e2e python scripts/run_backfill.py --article-ids <uuid1> <uuid2>

# Force re-index (skip "already indexed" check)
APP_ENV=e2e python scripts/run_backfill.py --force
```

**Pipeline:**
1. Fetch articles from PostgreSQL
2. Chunk text into sentences (spaCy)
3. Generate embeddings (sentence-transformers, BAAI/bge-m3)
4. Assign HIRO paths (mock initially, trained after step 2)
5. Index to Elasticsearch

### 2. Train HIRO Hierarchy

Once you have indexed content, train the hierarchy on the corpus embeddings:

```bash
APP_ENV=e2e python scripts/train_hiro_hierarchy.py train
```

**What happens:**
1. Extracts all embeddings from Elasticsearch (818 chunks)
2. Trains recursive k-means (12 clusters × 8 levels)
3. Saves model to `data/hiro/hierarchy.pkl` (6.4 MB)
4. Re-assigns HIRO paths based on trained clusters
5. Updates Elasticsearch with meaningful paths

**Note:** You'll see sklearn convergence warnings - this is normal for a small corpus where deeper levels can't form 12 distinct clusters.

### 3. Explore Topics

View cross-document topics discovered by HIRO:

```bash
APP_ENV=e2e python scripts/train_hiro_hierarchy.py topics
```

**Example output:**
```
Topics at Depth 2
========================================
1. Path: 0/3
   Docs: 11, Chunks: 39
   Sample: "is this how we want it to be?"...

2. Path: 11/9
   Docs: 10, Chunks: 21
   Sample: Meta, IBM, Intel, Oracle, AI Alliance...
```

### 4. Search Content

Interactive or single-query semantic search:

```bash
# Interactive mode
APP_ENV=e2e python scripts/index_and_search.py search

# Single query
APP_ENV=e2e python scripts/index_and_search.py search "data center electricity"

# Check index status
APP_ENV=e2e python scripts/index_and_search.py status
```

## Configuration

### Adapters (config/e2e.toml)

```toml
[adapters]
text_chunker = "spacy"                     # Sentence tokenization
embedding_generator = "sentence-transformers"  # Local BAAI/bge-m3
hiro_builder = "mock"                      # Use "sklearn" for trained
content_indexer = "elasticsearch"          # Elasticsearch Cloud
content_searcher = "elasticsearch"
```

### Embeddings (config/base.toml)

```toml
[embeddings]
model = "BAAI/bge-m3"   # 1024-dimensional embeddings
dimensions = 1024
batch_size = 100
```

### HIRO Parameters (config/base.toml)

```toml
[hiro]
k_clusters = 12        # Clusters per level
depth = 8              # Hierarchy depth
min_corpus_size = 1000 # Minimum for training
model_path = "data/hiro/hierarchy.pkl"
```

## Elasticsearch Indices

| Index | Purpose |
|-------|---------|
| `chunks_v1` | Chunks with embeddings, HIRO paths, subpaths |
| `docs_v1` | Document metadata (title, URL, bibtex) |
| `hiro_stats_v1` | Topic prevalence statistics |

### Chunk Document Structure

```json
{
  "chunk_id": "doc123_42",
  "doc_id": "doc123",
  "text": "AI data centers consume...",
  "embedding": [0.123, -0.456, ...],  // 1024 dims
  "hiro_path": [3, 5, 2, 9, 0, 1, 7, 4],
  "subpaths": ["3", "3/5", "3/5/2", "3/5/2/9", ...]
}
```

## API Endpoints (Coming Soon)

```
GET /api/v1/search?q=<query>&k=10
GET /api/v1/topics?depth=2&min_docs=2
GET /api/v1/chunks/{chunk_id}/similar
```

## How HIRO Clusters Work

### Training Phase

```python
# Recursive k-means at each level
def build_level(embeddings, depth):
    kmeans = KMeans(n_clusters=12)
    labels = kmeans.fit_predict(embeddings)

    for cluster_idx in range(12):
        cluster_embeddings = embeddings[labels == cluster_idx]
        if depth < 8 and len(cluster_embeddings) >= 2:
            build_level(cluster_embeddings, depth + 1)
```

### Encoding Phase

```python
# Assign path by descending hierarchy
def encode(embedding):
    path = []
    current_level = root

    for _ in range(8):
        cluster_idx = current_level.kmeans.predict(embedding)
        path.append(cluster_idx)
        current_level = current_level.children[cluster_idx]

    return path  # e.g., [3, 5, 2, 9, 0, 1, 7, 4]
```

### Topic Discovery

Chunks sharing the same path prefix are semantically similar:

```
Path [3, 5, ...]  →  "Energy consumption" topic
Path [11, 9, ...] →  "AI industry players" topic
```

## Troubleshooting

### "Complete result exceeds size limit"

The `embed_and_index_chunks_activity` combines embedding + indexing to avoid Temporal's 2MB payload limit. If you see this error, ensure you're using the combined activity.

### No topics at depth > 2

With a small corpus (< 1000 chunks), deeper levels won't have enough cross-document overlap. This is expected - topics become more specific at deeper levels.

### Convergence warnings during training

Normal for small corpora. sklearn can't form 12 distinct clusters when there aren't enough unique embeddings at deeper levels.

## Files Reference

| File | Purpose |
|------|---------|
| `scripts/run_backfill.py` | Index articles via BackfillWorkflow |
| `scripts/train_hiro_hierarchy.py` | Train hierarchy, view topics |
| `scripts/index_and_search.py` | Interactive search |
| `data/hiro/hierarchy.pkl` | Trained k-means models |
| `src/infrastructure/adapters/hiro/sklearn_hiro_builder.py` | HIRO implementation |
| `src/application/workflows/hiro_indexing_workflow.py` | Indexing workflow |

## Example Results

After training on 16 articles (818 chunks):

| Cluster | Docs | Theme |
|---------|------|-------|
| **0/3** | 11 | Ethics, policy, legislation |
| **11/9** | 10 | AI companies (Meta, IBM, Intel) |
| **3/5** | 5 | Energy consumption, power demand |
| **10/8** | 5 | Infrastructure scale, building frenzy |

---

*See also: `_specification/hiro-hierarchical-indexing.md` for full technical specification*
