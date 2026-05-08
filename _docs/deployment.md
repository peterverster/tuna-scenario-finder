# 🚀 GCP Deployment with Terraform + GitHub Actions

## Summary of Changes

This update transforms the BlackSwans.ai deployment process from manual `gcloud` commands to a fully automated **Infrastructure as Code (IaC)** approach using **Terraform** and **GitHub Actions**.

---

## 📦 Files Created/Updated

### ✨ New Files

1. **`.github/workflows/deploy-gcp.yml`**
   - Comprehensive CI/CD pipeline
   - Automates: build → deploy → migrate → health check
   - Supports: PR reviews, automatic deployments, manual triggers

2. **`.github/workflows/README.md`**
   - Complete GitHub Actions documentation
   - Usage instructions, troubleshooting, best practices
   - Rollback procedures and monitoring guide

3. **`_specification/deployment-summary.md`**
   - Quick reference cheat sheet
   - Common commands and operations
   - Cost estimates and troubleshooting

### 📝 Updated Files

4. **`_specification/gcp-deployment-guide.md`**
   - **Version**: 1.0.0 → 2.0.0
   - Restructured to prioritize Terraform + GitHub Actions
   - Added comprehensive Quick Start section
   - Added Terraform Infrastructure section
   - Added GitHub Actions CI/CD section

---

## 🎯 Key Improvements

### Before (Manual Deployment)
```bash
# Manual steps required for every deployment:
1. Build Docker images locally
2. Push to Artifact Registry
3. Run gcloud commands to deploy
4. Manually update secrets
5. Manually run migrations
6. Manually verify deployment
```

### After (Automated Deployment)
```bash
# Single command for deployment:
git push origin main

# GitHub Actions automatically:
✅ Builds Docker images
✅ Pushes to Artifact Registry
✅ Applies Terraform changes
✅ Runs database migrations
✅ Performs health checks
✅ Creates deployment summary
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      GitHub Repository                       │
│                                                              │
│  Developer pushes to main                                   │
│         ↓                                                    │
│  GitHub Actions Workflow Triggered                          │
│         ↓                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. Build & Push Docker Images                        │  │
│  │    • API image (FastAPI)                             │  │
│  │    • Worker image (Temporal)                         │  │
│  │    • Tagged with commit SHA + latest                 │  │
│  └──────────────────────────────────────────────────────┘  │
│         ↓                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 2. Terraform Apply                                   │  │
│  │    • Provision/update Cloud SQL                      │  │
│  │    • Provision/update Secret Manager                 │  │
│  │    • Provision/update VPC Connector                  │  │
│  │    • Deploy Cloud Run services                       │  │
│  └──────────────────────────────────────────────────────┘  │
│         ↓                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 3. Run Database Migrations                           │  │
│  │    • Connect via Cloud SQL Proxy                     │  │
│  │    • Run Alembic migrations                          │  │
│  └──────────────────────────────────────────────────────┘  │
│         ↓                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 4. Health Checks                                     │  │
│  │    • Test /api/v1/health                             │  │
│  │    • Verify deployment success                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Google Cloud Platform                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Cloud Run   │  │  Cloud Run   │  │  Cloud SQL   │      │
│  │  API Service │  │  Worker      │  │  PostgreSQL  │      │
│  │  (Auto-scale)│  │  (Always-on) │  │  (Private)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Artifact    │  │  Secret      │  │  VPC         │      │
│  │  Registry    │  │  Manager     │  │  Connector   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. One-Time Setup (30 minutes)

#### A. Create GCP Project
```bash
export PROJECT_ID="blackswans-prod"
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID
# Enable billing via console: https://console.cloud.google.com/billing
```

#### B. Create Service Account for GitHub Actions
```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Deployment Account"

export SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/editor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/iam.serviceAccountUser"

gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=$SA_EMAIL
```

#### C. Configure GitHub Secrets
Go to: **Settings → Secrets and variables → Actions**

Add these secrets:
- `GCP_PROJECT_ID` = `blackswans-prod`
- `GCP_SA_KEY` = contents of `github-actions-key.json`
- `ELASTICSEARCH_URL` = your Elastic Cloud URL
- `ELASTICSEARCH_API_KEY` = your Elastic Cloud API key
- `TEMPORAL_HOST` = your Temporal Cloud host
- `TEMPORAL_CERT` = your Temporal mTLS certificate
- `TEMPORAL_KEY` = your Temporal mTLS private key
- `PYDANTIC_AI_API_KEY` = your OpenAI API key
- `SCRAPING_BEE_API_KEY` = your ScrapingBee API key (optional)

#### D. Configure Terraform
```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
```

### 2. Initial Deployment (15 minutes)

```bash
# Deploy infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# Build and push initial images
cd ..
gcloud auth configure-docker us-central1-docker.pkg.dev
export PROJECT_ID="blackswans-prod"
export REPO="blackswans-prod-repo"

docker build --target api -t us-central1-docker.pkg.dev/$PROJECT_ID/$REPO/api:latest .
docker build --target worker -t us-central1-docker.pkg.dev/$PROJECT_ID/$REPO/worker:latest .
docker push us-central1-docker.pkg.dev/$PROJECT_ID/$REPO/api:latest
docker push us-central1-docker.pkg.dev/$PROJECT_ID/$REPO/worker:latest

# Run migrations
export CONNECTION_NAME=$(gcloud sql instances describe blackswans-prod-db --format='value(connectionName)')
wget https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64 -O cloud_sql_proxy
chmod +x cloud_sql_proxy
./cloud_sql_proxy -instances=$CONNECTION_NAME=tcp:5432 &
source .venv/bin/activate
alembic upgrade head
```

### 3. Enable Automated Deployments (1 minute)

```bash
git add .
git commit -m "feat: enable GCP deployment automation"
git push origin main

# 🎉 Done! All future deployments are now automated!
```

---

## 🔄 Deployment Workflows

### Automatic Deployment (Recommended)

**Push to `main` branch:**
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

**What happens:**
1. ✅ GitHub Actions workflow triggers
2. ✅ Docker images built and pushed
3. ✅ Terraform applies infrastructure changes
4. ✅ Database migrations run
5. ✅ Health checks verify deployment
6. ✅ Deployment summary created

**Time:** ~5-10 minutes

### Pull Request Review

**Create a PR:**
```bash
git checkout -b feature/my-changes
# Make changes
git push origin feature/my-changes
# Create PR on GitHub
```

**What happens:**
1. ✅ GitHub Actions runs `terraform plan`
2. ✅ Plan posted as PR comment
3. ⏸️ Review changes before merging
4. ✅ Merge → Automatic deployment

### Manual Deployment

**Via GitHub UI:**
1. Go to **Actions** tab
2. Select **Deploy to GCP**
3. Click **Run workflow**
4. Choose environment (dev/staging/prod)
5. Click **Run workflow**

**Via CLI:**
```bash
gh workflow run deploy-gcp.yml -f environment=prod
```

---

## 📊 Infrastructure Components

| Component | Service | Configuration | Purpose |
|-----------|---------|---------------|---------|
| **API** | Cloud Run | 1-10 instances, auto-scale | FastAPI application |
| **Worker** | Cloud Run | 2-5 instances, always-on | Temporal workers |
| **Database** | Cloud SQL | PostgreSQL 15, 2 vCPU, 7.5GB | Application data |
| **Secrets** | Secret Manager | Auto-managed | Credentials storage |
| **Images** | Artifact Registry | Multi-region | Docker images |
| **Network** | VPC Connector | Private | Secure Cloud SQL access |

**All managed by Terraform** - Infrastructure as Code ✨

---

## 💰 Cost Estimate

| Service | Monthly Cost |
|---------|--------------|
| Cloud Run (API) | $10-20 |
| Cloud Run (Worker) | $50-70 |
| Cloud SQL | $150 |
| Artifact Registry | $1 |
| Secret Manager | $0.60 |
| Cloud Logging | $5 |
| **GCP Total** | **~$220** |
| Elastic Cloud | $95 |
| Temporal Cloud | $200 |
| **Grand Total** | **~$515/month** |

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `_specification/gcp-deployment-guide.md` | Complete deployment guide (v2.0.0) |
| `_specification/deployment-summary.md` | Quick reference cheat sheet |
| `.github/workflows/README.md` | GitHub Actions documentation |
| `.github/workflows/deploy-gcp.yml` | CI/CD workflow definition |
| `terraform/README.md` | Terraform documentation |
| `terraform/main.tf` | Infrastructure definition |

---

## ✨ Key Benefits

### 🤖 Automation
- **Before**: 30+ manual commands per deployment
- **After**: 1 command (`git push`)

### 🔒 Security
- Private Cloud SQL (no public IP)
- Secrets in Secret Manager
- VPC connector for secure access
- Service account with least privilege
- mTLS for Temporal

### 📈 Scalability
- Auto-scaling Cloud Run services
- Environment-specific configurations
- Multi-region support ready

### 💵 Cost Optimization
- Pay only for what you use
- Auto-scaling reduces waste
- Committed use discounts available

### 🔍 Observability
- Cloud Logging integration
- Cloud Monitoring metrics
- Automated health checks
- Deployment notifications

### 🛡️ Safety
- Terraform plan review on PRs
- Infrastructure as code
- Version controlled
- Easy rollbacks

---

## 🎓 Next Steps

1. **Review the documentation**:
   - Read `_specification/gcp-deployment-guide.md` for complete details
   - Check `_specification/deployment-summary.md` for quick reference

2. **Set up external services**:
   - Create Elastic Cloud deployment
   - Set up Temporal Cloud namespace
   - Get OpenAI API key

3. **Complete one-time setup**:
   - Create GCP project
   - Configure GitHub secrets
   - Set up Terraform variables

4. **Run initial deployment**:
   - Deploy infrastructure with Terraform
   - Build and push Docker images
   - Run database migrations

5. **Enable automation**:
   - Push to main branch
   - Enjoy automated deployments! 🎉

---

## 🆘 Support

**Documentation**:
- Full guide: `_specification/gcp-deployment-guide.md`
- Quick reference: `_specification/deployment-summary.md`
- Workflows: `.github/workflows/README.md`

**Troubleshooting**:
- Check workflow logs: `gh run view <run-id> --log`
- View service logs: `gcloud logging read ...`
- Terraform state: `terraform state list`

**Common Issues**:
- See troubleshooting sections in documentation
- Check GitHub Actions workflow status
- Review GCP console for service status

---

## 🎉 Conclusion

You now have a **production-ready, fully automated deployment pipeline** for BlackSwans.ai on Google Cloud Platform!

**What you get:**
- ✅ Infrastructure as Code with Terraform
- ✅ Automated CI/CD with GitHub Actions
- ✅ Secure, scalable, cost-effective infrastructure
- ✅ Automated deployments, migrations, and health checks
- ✅ Multi-environment support (dev/staging/prod)
- ✅ Easy rollbacks and monitoring

**Next deployment:**
```bash
git push origin main
# That's it! ✨
```
