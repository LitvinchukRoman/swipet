terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.60"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Local state by default (test env, single operator). To share state across
  # the team switch this to an S3 backend — see README "Remote state".
  # backend "s3" {
  #   bucket = "swipet-tfstate"
  #   key    = "test/terraform.tfstate"
  #   region = "us-east-1"
  # }
}
