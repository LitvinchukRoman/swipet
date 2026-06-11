# Media bucket — replaces local MinIO. The backend uploads pet photos here and
# returns public object URLs (MINIO_PUBLIC_URL), so objects must be readable.
#
# NOTE: the backend's BucketBootstrap tries to makeBucket + set a public-read
# policy at startup. Against real S3 that fails (Block Public Access), so the
# instance runs with MINIO_AUTO_CREATE_BUCKET=false and Terraform owns the
# bucket config below.

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "media" {
  bucket = "${local.name}-media-${random_id.bucket_suffix.hex}"
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  # Public READ for served media (test env). Writes stay private (IAM creds only).
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

data "aws_iam_policy_document" "media_public_read" {
  statement {
    sid     = "PublicReadObjects"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    resources = ["${aws_s3_bucket.media.arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "media" {
  bucket     = aws_s3_bucket.media.id
  policy     = data.aws_iam_policy_document.media_public_read.json
  depends_on = [aws_s3_bucket_public_access_block.media]
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = ["*"]
    allowed_headers = ["*"]
    max_age_seconds = 3600
  }
}
