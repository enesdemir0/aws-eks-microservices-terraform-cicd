locals {
  oidc_issuer = replace(var.oidc_provider_url, "https://", "")
}

# IAM policy granting S3 access for image upload/download
resource "aws_iam_policy" "worker_s3" {
  name        = "${var.project_name}-worker-s3-policy"
  description = "S3 access for gateway and ai-worker pods via IRSA"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:HeadObject"
        ]
        Resource = "${var.s3_bucket_arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = var.s3_bucket_arn
      }
    ]
  })
}

# IAM role assumed by the visionmetric-worker Kubernetes service account
resource "aws_iam_role" "worker" {
  name = "${var.project_name}-worker-irsa-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Federated = var.oidc_provider_arn }
      Action    = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "${local.oidc_issuer}:sub" = "system:serviceaccount:${var.k8s_namespace}:${var.k8s_service_account}"
          "${local.oidc_issuer}:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "worker_s3" {
  policy_arn = aws_iam_policy.worker_s3.arn
  role       = aws_iam_role.worker.name
}
