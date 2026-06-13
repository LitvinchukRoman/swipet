# =============================================================================
# 1) App IAM user — S3 credentials consumed by the backend's MinIO client
#    (MINIO_ACCESS_KEY / MINIO_SECRET_KEY). Scoped to the media bucket only.
# =============================================================================
resource "aws_iam_user" "app" {
  name = "${local.name}-app-s3"
}

data "aws_iam_policy_document" "app_s3" {
  statement {
    sid    = "BucketLevel"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]
    resources = [aws_s3_bucket.media.arn]
  }

  statement {
    sid    = "ObjectLevel"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
    ]
    resources = ["${aws_s3_bucket.media.arn}/*"]
  }
}

resource "aws_iam_user_policy" "app_s3" {
  name   = "s3-media"
  user   = aws_iam_user.app.name
  policy = data.aws_iam_policy_document.app_s3.json
}

resource "aws_iam_access_key" "app" {
  user = aws_iam_user.app.name
}

# =============================================================================
# 2) EC2 instance role — SSM (for CI deploys + shell) and reading app secrets.
# =============================================================================
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ec2" {
  name               = "${local.name}-ec2"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

# Managed SSM access so we can run deploy commands without SSH keys.
resource "aws_iam_role_policy_attachment" "ssm_core" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

data "aws_iam_policy_document" "ec2_inline" {
  statement {
    sid       = "ReadAppSecrets"
    effect    = "Allow"
    actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = ["arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${local.ssm_prefix}/*"]
  }
}

resource "aws_iam_role_policy" "ec2_inline" {
  name   = "swipet-runtime"
  role   = aws_iam_role.ec2.id
  policy = data.aws_iam_policy_document.ec2_inline.json
}

resource "aws_iam_instance_profile" "ec2" {
  name = "${local.name}-ec2"
  role = aws_iam_role.ec2.name
}

# =============================================================================
# 3) GitHub Actions OIDC — lets CI push images and trigger deploys with no
#    long-lived AWS keys in the repo.
# =============================================================================
resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

locals {
  github_oidc_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "github_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_repo}:*"]
    }
  }
}

resource "aws_iam_role" "github_deploy" {
  name               = "${local.name}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
}

# Images are built and pushed to Docker Hub by CI (using DOCKERHUB_* secrets),
# so the AWS deploy role only needs to trigger the in-place SSM deploy.
data "aws_iam_policy_document" "github_deploy" {
  # Trigger an in-place deploy of a single service on the instance.
  statement {
    sid     = "SsmDeploy"
    effect  = "Allow"
    actions = ["ssm:SendCommand"]
    resources = [
      "arn:aws:ssm:${var.aws_region}::document/AWS-RunShellScript",
      "arn:aws:ec2:${var.aws_region}:${data.aws_caller_identity.current.account_id}:instance/${aws_instance.app.id}",
    ]
  }

  statement {
    sid       = "SsmPoll"
    effect    = "Allow"
    actions   = ["ssm:GetCommandInvocation", "ssm:ListCommandInvocations"]
    resources = ["*"]
  }

  # Frontend deploy: sync the exported web bundle into the private S3 origin.
  statement {
    sid       = "FrontendS3List"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.frontend.arn]
  }

  statement {
    sid       = "FrontendS3Objects"
    effect    = "Allow"
    actions   = ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]
  }

  # Bust the CloudFront edge cache after each deploy.
  statement {
    sid       = "FrontendCloudFrontInvalidate"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation", "cloudfront:GetInvalidation"]
    resources = [aws_cloudfront_distribution.frontend.arn]
  }
}

resource "aws_iam_role_policy" "github_deploy" {
  name   = "deploy"
  role   = aws_iam_role.github_deploy.id
  policy = data.aws_iam_policy_document.github_deploy.json
}
