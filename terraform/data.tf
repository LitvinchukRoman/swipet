data "aws_caller_identity" "current" {}

# Use the account's default VPC + subnets to keep this test stack tiny.
# (For anything beyond a throwaway env, build a dedicated VPC instead.)
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Amazon Linux 2023 — ships with SSM Agent + AWS CLI v2 preinstalled, which
# makes the user_data (SSM secret fetch, SSM-driven deploys) much simpler.
data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
