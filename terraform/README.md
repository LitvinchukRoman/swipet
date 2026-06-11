# Swipet — AWS test environment (Terraform)

Minimal, cheap, single-host AWS stack for the Swipet test environment
(~2 concurrent users). One EC2 box runs **everything** via `docker compose`:
Postgres, the Spring backend and the Node chat-service. **Caddy** on the box
terminates HTTPS (your `*.naukma.com` wildcard cert) and reverse-proxies to both
services. Object storage is S3, images come from Docker Hub, DNS is Route53
(`naukma.com`).

State is a **local file** (`terraform.tfstate` in this folder).

## Seed data

The backend's Flyway migration `V11__seed_data.sql` runs automatically the first
time the app connects to the fresh Postgres container, so the environment comes
up **already populated**: an admin, three shelter-admins (`shelter_*@swipet.com`,
password `password`) with their shelters, and ~30 animals. Testers can register
adopters and start chatting immediately. (`src/test/resources/data.sql` is for
unit tests only and is not used here.)

## What gets created

| Resource | What it is | Notes |
| --- | --- | --- |
| **EC2** `t3.small` (Amazon Linux 2023) | Runs postgres + backend + chat-service + Caddy | `user_data` installs Docker + Caddy, pulls the public images, renders `.env`, starts compose, writes the wildcard cert |
| **Caddy** (on the box) | HTTPS termination + reverse proxy | `swipet.naukma.com` -> :8080, `chat.swipet.naukma.com` -> :3001 (WebSocket-aware) |
| **Elastic IP** | Stable public IP | DNS records point here; survives instance recreation |
| **Route53 records** | `swipet.naukma.com`, `chat.swipet.naukma.com` | A records -> the EIP |
| **S3** bucket | Pet-photo storage (replaces local MinIO) | Public-read objects, private writes via IAM keys |
| **IAM user** + access key | S3 creds for the backend MinIO client (`MINIO_ACCESS_KEY/SECRET_KEY`) | Scoped to the media bucket only |
| **IAM role (OIDC)** | Assumed by GitHub Actions to trigger deploys | No static AWS keys in the repo |
| **SSM Parameters** | Runtime secrets (DB pw, JWT, S3 keys, Docker Hub creds, Stripe) | Fetched at boot; instance role can read `/swipet/test/*` |

There is **no RDS** — Postgres is a container on the box (cheaper for a 2-user
test env), its data on a Docker volume on the EBS root disk.

```
  https://swipet.naukma.com      ┌─────────────────────────────────────────┐
 ──────────────────────────────► │ EC2 (Elastic IP)                          │
  https://chat.swipet.naukma.com │  Caddy :443  ── reverse_proxy ──┐         │
 ──────────────────────────────► │                                 ▼         │
                                 │  docker compose: postgres + backend:8080  │
                                 │                  + chat-service:3001       │
                                 └──────────────────┬────────────────────────┘
                                                    │ S3 API (eu-central-1)
                                             ┌──────┴───────┐
                                             │ S3 media bkt │  public GET / private PUT
                                             └──────────────┘
```

## Region

Defaults to **eu-central-1 (Frankfurt)**. The backend's MinIO S3 client is
region-aware via `MINIO_REGION` (Terraform passes it = `aws_region`), so SigV4 is
signed correctly. The startup bucket-bootstrap is disabled in prod
(`MINIO_AUTO_CREATE_BUCKET=false`); Terraform owns the public-read bucket.

> Requires the backend code with the `MINIO_REGION` support (StorageConfig sets
> `MinioClient.region(...)`). Without it, S3 in any non-us-east-1 region rejects
> requests.

## Usage

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars   # edit: dockerhub creds, admin_cidrs, github_repo

terraform init
terraform apply
```

Key outputs:

```bash
terraform output instance_id            # -> GitHub var SSM_INSTANCE_ID
terraform output github_deploy_role_arn # -> GitHub var AWS_DEPLOY_ROLE_ARN
terraform output backend_url chat_url app_public_ip s3_media_bucket
```

### First images

`docker compose pull` on the box fails if the Docker Hub repos are empty.
Bootstrap them once (or just push to `main` and let CI do it):

```bash
docker login -u <user>
# EC2 is x86_64 — force linux/amd64 so the images run there.
# (A plain `docker build` on an Apple Silicon Mac produces arm64, which the
#  instance can't run: "exec format error".)
docker buildx build --platform linux/amd64 -t <user>/swipet-backend:latest      --push ../backend
docker buildx build --platform linux/amd64 -t <user>/swipet-chat-service:latest --push ../chat-service
```

Then `terraform apply` (or reboot the instance) so `user_data` pulls them.

## CI/CD

Two workflows in `.github/workflows/`:

- `deploy-backend.yml` — triggers only on `backend/**`
- `deploy-chat-service.yml` — triggers only on `chat-service/**`

Each: logs in to Docker Hub → builds the service image → pushes `:latest` and
`:<sha>` → assumes the OIDC AWS role → runs an **SSM command that updates only
that one service**:

```bash
docker compose pull <service>
docker compose up -d --no-deps <service>
```

`--no-deps` + the path filter guarantee a backend change never touches the
chat-service (or postgres) and vice-versa — CI always updates the right backend.

### Required GitHub Actions config

Settings → Secrets and variables → Actions:

**Secrets**

| Secret | Value |
| --- | --- |
| `DOCKERHUB_USERNAME` | your Docker Hub user/namespace |
| `DOCKERHUB_TOKEN` | Docker Hub access token (read+write) |

**Variables** (from `terraform output`)

| Variable | Value |
| --- | --- |
| `AWS_REGION` | `eu-central-1` |
| `AWS_DEPLOY_ROLE_ARN` | `github_deploy_role_arn` |
| `SSM_INSTANCE_ID` | `instance_id` |

## Access the box

```bash
# Session Manager (no SSH key, no open port needed)
aws ssm start-session --target $(terraform output -raw instance_id)

# bootstrap log / container status
sudo tail -f /var/log/swipet-bootstrap.log
cd /opt/swipet && sudo docker compose ps
```

## Cost & teardown

EC2 `t3.small` + EIP + small EBS/S3 — a few dollars a month if left running
(no RDS, no NAT, no ALB). Tear down with `terraform destroy`.

## Known trade-offs (it's a test env)

- `admin_cidrs` defaults to `0.0.0.0/0` — **lock it to your IP** (this only
  affects the debug ports 8080/3001/22; public traffic goes through Caddy:443).
- HTTPS is terminated by Caddy. Default (empty `tls_*_path`): Caddy obtains and
  **auto-renews** certs via ACME for the two subdomains (port 80 + public DNS are
  set up here). Setting `tls_*_path` switches to your static wildcard cert, which
  does **not** auto-renew (re-apply on rotation).
- Postgres data lives on the instance's EBS volume — a terminated instance loses
  the DB unless you snapshot. Fine for a throwaway test env.
- S3 media objects are world-readable.
- Images roll on `:latest`; rollback = redeploy an older `:<sha>` manually.
- Single AZ, single instance, no autoscaling.
