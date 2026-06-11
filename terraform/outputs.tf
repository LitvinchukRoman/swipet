output "instance_id" {
  description = "EC2 instance id — set this as the GitHub Actions variable SSM_INSTANCE_ID."
  value       = aws_instance.app.id
}

output "app_public_ip" {
  description = "Elastic IP attached to the instance (stable across recreation)."
  value       = aws_eip.app.public_ip
}

output "backend_fqdn" {
  value = local.backend_fqdn
}

output "chat_fqdn" {
  value = local.chat_fqdn
}

output "backend_url" {
  description = "Public HTTPS API (Caddy -> backend:8080)."
  value       = "https://${local.backend_fqdn}"
}

output "chat_url" {
  description = "Public HTTPS chat / Socket.io (Caddy -> chat-service:3001)."
  value       = "https://${local.chat_fqdn}"
}

output "s3_media_bucket" {
  value = aws_s3_bucket.media.bucket
}

output "backend_image" {
  description = "Docker Hub image the box pulls for the backend."
  value       = local.backend_image
}

output "chat_image" {
  description = "Docker Hub image the box pulls for the chat-service."
  value       = local.chat_image
}

output "github_deploy_role_arn" {
  description = "GitHub Actions variable AWS_DEPLOY_ROLE_ARN."
  value       = aws_iam_role.github_deploy.arn
}

output "ssh_private_key_ssm_param" {
  description = "Read the EC2 private key: aws ssm get-parameter --name <this> --with-decryption"
  value       = aws_ssm_parameter.ssh_private_key.name
}
