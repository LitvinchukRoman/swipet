# -----------------------------
# App host security group
# -----------------------------
resource "aws_security_group" "app" {
  name        = "${local.name}-app"
  description = "Swipet app host (Spring backend + Node chat)"
  vpc_id      = data.aws_vpc.default.id

  tags = { Name = "${local.name}-app" }
}

resource "aws_vpc_security_group_ingress_rule" "app_ssh" {
  for_each          = toset(var.admin_cidrs)
  security_group_id = aws_security_group.app.id
  description       = "SSH"
  ip_protocol       = "tcp"
  from_port         = 22
  to_port           = 22
  cidr_ipv4         = each.value
}

# Public HTTPS — Caddy terminates TLS and reverse-proxies to backend/chat.
resource "aws_vpc_security_group_ingress_rule" "app_https" {
  security_group_id = aws_security_group.app.id
  description       = "HTTPS (Caddy)"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  cidr_ipv4         = "0.0.0.0/0"
}

# HTTP — Caddy redirects to HTTPS (and serves ACME challenges if no custom cert).
resource "aws_vpc_security_group_ingress_rule" "app_http" {
  security_group_id = aws_security_group.app.id
  description       = "HTTP to HTTPS redirect / ACME"
  ip_protocol       = "tcp"
  from_port         = 80
  to_port           = 80
  cidr_ipv4         = "0.0.0.0/0"
}

# Raw service ports — kept open only to admins for debugging (Caddy is the
# public entrypoint on 443).
resource "aws_vpc_security_group_ingress_rule" "app_backend" {
  for_each          = toset(var.admin_cidrs)
  security_group_id = aws_security_group.app.id
  description       = "Spring backend (debug)"
  ip_protocol       = "tcp"
  from_port         = 8080
  to_port           = 8080
  cidr_ipv4         = each.value
}

resource "aws_vpc_security_group_ingress_rule" "app_chat" {
  for_each          = toset(var.admin_cidrs)
  security_group_id = aws_security_group.app.id
  description       = "Node chat service (debug)"
  ip_protocol       = "tcp"
  from_port         = 3001
  to_port           = 3001
  cidr_ipv4         = each.value
}

resource "aws_vpc_security_group_egress_rule" "app_all" {
  security_group_id = aws_security_group.app.id
  description       = "All outbound"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

# Postgres runs as a container on this same host — no security group needed,
# it is only reachable inside the docker network (not published on the host).
