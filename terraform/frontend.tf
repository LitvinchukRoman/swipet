# =============================================================================
# Static frontend hosting: Expo web export (dist/) -> private S3 -> CloudFront.
#
# Flow: CI runs `expo export -p web` (baking EXPO_PUBLIC_* into the bundle),
# `aws s3 sync`s dist/ into the bucket below, then invalidates the distribution.
# The bucket stays fully private; only CloudFront can read it via OAC.
# =============================================================================

# ----------------------------- S3 (private origin) --------------------------
resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name}-frontend-${random_id.bucket_suffix.hex}"
}

# Unlike the media bucket, this one is NEVER public — CloudFront reads it via
# Origin Access Control (SigV4), so block everything public.
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket     = aws_s3_bucket.frontend.id
  policy     = data.aws_iam_policy_document.frontend_oac.json
  depends_on = [aws_s3_bucket_public_access_block.frontend]
}

# Only this CloudFront distribution may GetObject from the bucket.
data "aws_iam_policy_document" "frontend_oac" {
  statement {
    sid     = "AllowCloudFrontRead"
    effect  = "Allow"
    actions = ["s3:GetObject"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

# ----------------------------- TLS cert (us-east-1) -------------------------
resource "aws_acm_certificate" "frontend" {
  provider          = aws.us_east_1
  domain_name       = local.frontend_fqdn
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "frontend_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id         = data.aws_route53_zone.this.zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "frontend" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.frontend.arn
  validation_record_fqdns = [for r in aws_route53_record.frontend_cert_validation : r.fqdn]
}

# ----------------------------- CloudFront -----------------------------------
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name}-frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# Expo static export writes one .html per route (e.g. /login -> login.html) plus
# hashed JS for the client runtime. This viewer-request function maps clean URLs
# onto those files: "/" -> index.html, "/login" -> login.html. Truly dynamic
# routes (/animal/123 -> animal/123.html, which doesn't exist) fall through to
# the 403/404 -> /index.html handler below, where the client router takes over.
resource "aws_cloudfront_function" "rewrite" {
  name    = "${local.name}-frontend-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Pretty-URL -> .html rewrite for Expo static export"
  publish = true
  code    = <<-EOT
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      if (uri.endsWith('/')) {
        request.uri += 'index.html';
      } else if (!uri.includes('.')) {
        request.uri += '.html';
      }
      return request;
    }
  EOT
}

# Managed cache policies (stable AWS-owned IDs).
data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${local.name} frontend (Expo web)"
  default_root_object = "index.html"
  price_class         = "PriceClass_100" # US/EU edges — cheapest, fine for this env
  aliases             = [local.frontend_fqdn]

  origin {
    origin_id                = "s3-frontend"
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.rewrite.arn
    }
  }

  # SPA fallback: any missing object (dynamic routes, deep links) serves the
  # app shell with 200 so the client-side router can resolve the path.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.frontend.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# ----------------------------- DNS ------------------------------------------
# swipet.naukma.com -> CloudFront distribution (alias A/AAAA).
#
# This apex previously pointed at the EC2 EIP (backend). The backend record now
# moves to api.swipet.naukma.com, so we take over swipet.naukma.com here:
#   - depends_on forces the backend record to be repointed FIRST, so the old
#     A->EIP for swipet.naukma.com is gone before we claim the name.
#   - allow_overwrite lets us UPSERT the alias even if a stale record lingers.
resource "aws_route53_record" "frontend" {
  zone_id         = data.aws_route53_zone.this.zone_id
  name            = local.frontend_fqdn
  type            = "A"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }

  depends_on = [aws_route53_record.backend]
}

resource "aws_route53_record" "frontend_aaaa" {
  zone_id         = data.aws_route53_zone.this.zone_id
  name            = local.frontend_fqdn
  type            = "AAAA"
  allow_overwrite = true

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }

  depends_on = [aws_route53_record.backend]
}
