# Database Setup — Cloud SQL for PostgreSQL

## GCP-side setup (one-time, outside the codebase)

### 1. Create the Cloud SQL instance

Use the smallest shared-core tier appropriate for low-traffic / early-stage use.
**Always verify current tier names and pricing at the live Cloud SQL pricing page before
provisioning** — tier names and prices change and any hardcoded values here will go stale.

```bash
gcloud sql instances create cowork-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \          # cheapest shared-core; check current options
  --region=us-central1 \        # pick the region closest to your Cloud Run service
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --no-backup \                 # disable for dev; enable for production
  --availability-type=ZONAL    # single-zone, no HA — appropriate for early stage
```

> **Cost note:** `db-f1-micro` is the cheapest option as of writing but check
> https://cloud.google.com/sql/pricing before provisioning. No read replicas,
> no HA, no AlloyDB — single small instance only.

### 2. Create the application database

```bash
gcloud sql databases create cowork \
  --instance=cowork-db
```

### 3. Create a dedicated app user (NOT the postgres superuser)

```bash
gcloud sql users create cowork_app \
  --instance=cowork-db \
  --password=CHOOSE_A_STRONG_PASSWORD
```

Grant the user access to the database (connect via Cloud SQL Auth Proxy or Cloud Shell):

```sql
GRANT ALL PRIVILEGES ON DATABASE cowork TO cowork_app;
-- After running migrations, also grant schema-level access:
GRANT ALL ON SCHEMA public TO cowork_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO cowork_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO cowork_app;
```

### 4. Note your instance connection name

```bash
gcloud sql instances describe cowork-db --format="value(connectionName)"
# Output: PROJECT_ID:REGION:cowork-db
```

Set this as `INSTANCE_CONNECTION_NAME` in your `.env`.

---

## Local development

### Option A — Cloud SQL Auth Proxy (mirrors Cloud Run exactly, recommended)

Download the proxy: https://cloud.google.com/sql/docs/postgres/sql-proxy

```powershell
# Windows PowerShell
.\cloud-sql-proxy.exe --unix-socket C:\cloudsql PROJECT_ID:REGION:cowork-db
```

Then set in `.env`:
```
DATABASE_URL="postgresql://cowork_app:PASSWORD@localhost/cowork?host=C:/cloudsql/PROJECT_ID:REGION:cowork-db"
```

### Option B — Local Postgres (simplest, no proxy)

Install Postgres locally, create a `cowork` database and `cowork_app` user, then:
```
DATABASE_URL="postgresql://cowork_app:PASSWORD@localhost:5432/cowork"
```

---

## Running migrations

```bash
# First time (creates migration history + applies schema)
npx prisma migrate dev --name init

# Subsequent schema changes
npx prisma migrate dev --name describe_your_change

# Production deploy (applies pending migrations, no prompt)
npx prisma migrate deploy
```

---

## Cloud Run deployment

Add the `--add-cloudsql-instances` flag to your deploy command:

```bash
gcloud run deploy cowork \
  --image gcr.io/PROJECT_ID/cowork \
  --add-cloudsql-instances PROJECT_ID:REGION:cowork-db \
  --set-env-vars "DATABASE_URL=postgresql://cowork_app:PASSWORD@localhost/cowork?host=/cloudsql/PROJECT_ID:REGION:cowork-db" \
  --set-env-vars "GEMINI_API_KEY=..." \
  --region us-central1 \
  --allow-unauthenticated
```

The `--add-cloudsql-instances` flag mounts the Cloud SQL socket at
`/cloudsql/PROJECT:REGION:INSTANCE` inside the container automatically — no
proxy binary needed in the image.

---

## Health check

Once the server is running, verify the DB connection:

```bash
curl http://localhost:3000/health/db
# {"status":"ok","db":"connected","timestamp":"..."}
```
