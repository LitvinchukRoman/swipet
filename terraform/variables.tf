variable "project" {
  description = "Project slug, used for naming and tagging."
  type        = string
  default     = "swipet"
}

variable "environment" {
  description = "Environment slug (this is a throwaway test environment)."
  type        = string
  default     = "test"
}

variable "aws_region" {
  description = <<-EOT
    AWS region. The backend's MinIO S3 client is region-aware via MINIO_REGION
    (passed automatically = this region), so any region works. Defaults to
    eu-central-1 (Frankfurt).
  EOT
  type        = string
  default     = "eu-central-1"
}

# ----------------------------- Networking -----------------------------------

variable "admin_cidrs" {
  description = "CIDRs allowed to reach SSH (22) and the app ports (8080/3001). Lock this to your IP."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

# ----------------------------- EC2 ------------------------------------------

variable "instance_type" {
  description = "EC2 type. t3.small (2 vCPU / 2 GiB) comfortably runs JVM backend + Node chat for ~2 users."
  type        = string
  default     = "t3.small"
}

variable "root_volume_gb" {
  description = "Root EBS volume size (GiB)."
  type        = number
  default     = 20
}

# ----------------------------- Database (Postgres container on EC2) ---------
# No RDS — cheaper to run Postgres as a container on the same box for a 2-user
# test env. Data lives on a Docker volume on the instance's EBS root disk.

variable "db_name" {
  description = "Initial database name."
  type        = string
  default     = "swipet"
}

variable "db_username" {
  description = "DB username."
  type        = string
  default     = "swipet_user"
}

# ----------------------------- App config ----------------------------------

variable "frontend_url" {
  description = "Comma-separated CORS origins / Socket.io allowed origins."
  type        = string
  default     = "*"
}

variable "stripe_api_key" {
  description = "Stripe secret key (optional for test; donations stay disabled if left as placeholder)."
  type        = string
  default     = "sk_test_placeholder"
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook signing secret (optional for test)."
  type        = string
  default     = "whsec_placeholder"
  sensitive   = true
}

variable "image_tag" {
  description = "Container image tag the instance pulls on first boot. CI updates these in-place afterwards."
  type        = string
  default     = "latest"
}

# ----------------------------- Docker Hub -----------------------------------
# Only the username is needed by Terraform — it forms the public image repo
# prefix (<user>/swipet-backend). The push token lives in GitHub Secrets
# (used by CI); the EC2 host pulls public images anonymously, no login needed.

variable "dockerhub_username" {
  description = "Docker Hub username/namespace that owns the swipet images (also used as the image repo prefix)."
  type        = string
}

# ----------------------------- TLS / HTTPS (Caddy) --------------------------
# HTTPS is terminated by Caddy on the instance. Provide your wildcard cert
# (*.naukma.com) and Caddy serves it directly — no ACME needed. Leave both
# empty to fall back to Caddy automatic HTTPS (Let's Encrypt).

variable "tls_cert_path" {
  description = "Path to the wildcard fullchain PEM (cert + intermediates). Empty -> Caddy auto-HTTPS."
  type        = string
  default     = ""
}

variable "tls_key_path" {
  description = "Path to the wildcard private key PEM. Empty -> Caddy auto-HTTPS."
  type        = string
  default     = ""
}

variable "acme_email" {
  description = "Contact email for ACME/Let's Encrypt (used only in auto-HTTPS mode). Recommended for renewal notices."
  type        = string
  default     = ""
}

# ----------------------------- DNS (Route53) --------------------------------

variable "hosted_zone_name" {
  description = "Existing Route53 hosted zone these records live under."
  type        = string
  default     = "naukma.com"
}

variable "backend_subdomain" {
  description = "Subdomain for the Spring backend API. Lives at swipet-api.naukma.com so the apex swipet.naukma.com is free for the static frontend (CloudFront)."
  type        = string
  default     = "swipet-api"
}

variable "chat_subdomain" {
  description = "Subdomain for the Node chat service."
  type        = string
  default     = "chat.swipet"
}

variable "frontend_subdomain" {
  description = <<-EOT
    Subdomain for the static Expo web app served via CloudFront. Takes the apex
    swipet.naukma.com; the backend moved to api.swipet.naukma.com to free it.
  EOT
  type        = string
  default     = "swipet"
}

# ----------------------------- CI / CD (GitHub OIDC) ------------------------

variable "github_repo" {
  description = "GitHub repo allowed to assume the deploy role, as 'owner/name'."
  type        = string
  default     = "LitvinchukRoman/swipet"
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub OIDC provider. Set false if the account already has one."
  type        = bool
  default     = true
}
