locals {
  user_data = templatefile("${path.module}/templates/user_data.sh.tftpl", {
    aws_region    = var.aws_region
    ssm_prefix    = local.ssm_prefix
    backend_image = local.backend_image
    chat_image    = local.chat_image
    bucket        = aws_s3_bucket.media.bucket
    s3_endpoint   = local.s3_endpoint
    s3_region     = var.aws_region
    # Postgres is a container on this host, reachable on the compose network.
    db_host      = "postgres"
    db_port      = "5432"
    db_name      = var.db_name
    db_user      = var.db_username
    jwt_issuer   = "swipet-backend"
    frontend_url = var.frontend_url
    # Публічний origin вебзастосунку (де залогінений юзер) — туди Stripe робить
    # success/cancel redirect. Має збігатися з доменом фронтенду, інакше після
    # оплати губиться сесія і verify-session повертає 401.
    app_public_url = "https://${local.frontend_fqdn}"
    backend_fqdn   = local.backend_fqdn
    chat_fqdn      = local.chat_fqdn
    custom_tls     = local.use_custom_tls ? "true" : "false"
    acme_email     = var.acme_email
    # Passed as a value, so the ${...} inside the compose file are NOT
    # re-interpreted by templatefile — they survive for docker compose.
    compose_file = file("${path.module}/files/docker-compose.prod.yml")
  })
}

resource "aws_instance" "app" {
  ami                         = data.aws_ami.al2023.id
  instance_type               = var.instance_type
  subnet_id                   = data.aws_subnets.default.ids[0]
  vpc_security_group_ids      = [aws_security_group.app.id]
  associate_public_ip_address = true
  key_name                    = aws_key_pair.this.key_name
  iam_instance_profile        = aws_iam_instance_profile.ec2.name

  user_data                   = local.user_data
  user_data_replace_on_change = true

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_gb
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_tokens   = "required" # IMDSv2
    http_endpoint = "enabled"
  }

  tags = { Name = "${local.name}-app" }

  lifecycle {
    # `data.aws_ami.al2023` tracks the LATEST AL2023 image, which drifts every
    # time AWS publishes a new one and would force-replace this box. Pin to
    # whatever AMI the box already runs.
    #
    # NOTE: user_data is intentionally NOT ignored — editing it (new envs like
    # APP_PUBLIC_URL, new backend_fqdn/Caddyfile host) combined with
    # `user_data_replace_on_change = true` recreates the box so the fresh
    # bootstrap re-fetches all SSM secrets and renders a correct /opt/swipet/.env.
    #
    # ⚠️ Recreation WIPES the on-host Postgres data (DB is a container on the EBS
    # root) and changes the instance id — update the GitHub Actions variable
    # SSM_INSTANCE_ID afterwards (`terraform output instance_id`).
    ignore_changes = [ami]
  }

  # Secrets must exist before the box boots and reads them.
  depends_on = [
    aws_ssm_parameter.db_password,
    aws_ssm_parameter.jwt_secret,
    aws_ssm_parameter.s3_access_key,
    aws_ssm_parameter.s3_secret_key,
    aws_ssm_parameter.stripe_api_key,
    aws_ssm_parameter.stripe_webhook_secret,
    aws_ssm_parameter.tls_cert,
    aws_ssm_parameter.tls_key,
  ]
}
