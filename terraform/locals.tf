locals {
  name = "${var.project}-${var.environment}"

  # Path-style S3 endpoint used by the backend's MinIO client (region-aware via
  # MINIO_REGION). e.g. https://s3.eu-central-1.amazonaws.com
  s3_endpoint = "https://s3.${var.aws_region}.amazonaws.com"

  ssm_prefix = "/${var.project}/${var.environment}"

  # Docker Hub image references. CI pushes <user>/swipet-backend and
  # <user>/swipet-chat-service; the box pulls the same names.
  # lower(): Docker Hub repo namespaces are ALWAYS lowercase. Without this a
  # mixed-case var (e.g. "LitvinchukRoman", same as the GitHub handle) produces
  # an invalid reference and the box silently boots without the backend.
  dockerhub_namespace = lower(var.dockerhub_username)
  backend_image       = "${local.dockerhub_namespace}/swipet-backend:${var.image_tag}"
  chat_image          = "${local.dockerhub_namespace}/swipet-chat-service:${var.image_tag}"

  backend_fqdn  = "${var.backend_subdomain}.${var.hosted_zone_name}"
  chat_fqdn     = "${var.chat_subdomain}.${var.hosted_zone_name}"
  frontend_fqdn = "${var.frontend_subdomain}.${var.hosted_zone_name}"

  # Use the operator-provided wildcard cert when both files are given;
  # otherwise Caddy obtains certs automatically via ACME.
  use_custom_tls = var.tls_cert_path != "" && var.tls_key_path != ""
}
