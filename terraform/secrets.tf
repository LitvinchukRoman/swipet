# Postgres password (DB runs as a container on the EC2 host; password is still
# kept out of state-visible plaintext where possible and injected via SSM).
resource "random_password" "db" {
  length  = 24
  special = false # keep it connection-string safe
}

# Shared HS256 secret — MUST be identical for backend (token issuer) and
# chat-service (local token verification). >= 256 bit.
resource "random_password" "jwt" {
  length  = 64
  special = false
}

# SSH keypair (Session Manager is the primary access path, but a key is handy).
resource "tls_private_key" "ssh" {
  algorithm = "ED25519"
}

resource "aws_key_pair" "this" {
  key_name   = local.name
  public_key = tls_private_key.ssh.public_key_openssh
}

resource "aws_ssm_parameter" "ssh_private_key" {
  name  = "${local.ssm_prefix}/ssh_private_key"
  type  = "SecureString"
  value = tls_private_key.ssh.private_key_openssh
}

# -----------------------------
# Runtime secrets — fetched by user_data at boot and written into /opt/swipet/.env
# -----------------------------
resource "aws_ssm_parameter" "db_password" {
  name  = "${local.ssm_prefix}/db_password"
  type  = "SecureString"
  value = random_password.db.result
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "${local.ssm_prefix}/jwt_secret"
  type  = "SecureString"
  value = random_password.jwt.result
}

resource "aws_ssm_parameter" "s3_access_key" {
  name  = "${local.ssm_prefix}/s3_access_key"
  type  = "SecureString"
  value = aws_iam_access_key.app.id
}

resource "aws_ssm_parameter" "s3_secret_key" {
  name  = "${local.ssm_prefix}/s3_secret_key"
  type  = "SecureString"
  value = aws_iam_access_key.app.secret
}

resource "aws_ssm_parameter" "stripe_api_key" {
  name  = "${local.ssm_prefix}/stripe_api_key"
  type  = "SecureString"
  value = var.stripe_api_key
}

resource "aws_ssm_parameter" "stripe_webhook_secret" {
  name  = "${local.ssm_prefix}/stripe_webhook_secret"
  type  = "SecureString"
  value = var.stripe_webhook_secret
}

# Wildcard TLS cert/key for Caddy. Intelligent-Tiering auto-upgrades to the
# Advanced tier if a fullchain exceeds the 4 KB standard limit.
resource "aws_ssm_parameter" "tls_cert" {
  count = local.use_custom_tls ? 1 : 0
  name  = "${local.ssm_prefix}/tls_cert"
  type  = "SecureString"
  tier  = "Intelligent-Tiering"
  value = file(pathexpand(var.tls_cert_path))
}

resource "aws_ssm_parameter" "tls_key" {
  count = local.use_custom_tls ? 1 : 0
  name  = "${local.ssm_prefix}/tls_key"
  type  = "SecureString"
  tier  = "Intelligent-Tiering"
  value = file(pathexpand(var.tls_key_path))
}

# No Docker Hub creds in SSM: images are public, so the host pulls anonymously.
# CI authenticates to push using DOCKERHUB_* GitHub Secrets.
