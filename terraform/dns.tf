# Stable public IP so DNS records survive instance recreation
# (user_data_replace_on_change recreates the box on bootstrap edits).
resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id
  tags     = { Name = "${local.name}-app" }
}

data "aws_route53_zone" "this" {
  name         = "${var.hosted_zone_name}."
  private_zone = false
}

# swipet-api.naukma.com  -> Spring backend API  (:8080)
resource "aws_route53_record" "backend" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = local.backend_fqdn
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

# chat.swipet.naukma.com -> Node chat service   (:3001)
resource "aws_route53_record" "chat" {
  zone_id = data.aws_route53_zone.this.zone_id
  name    = local.chat_fqdn
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}
