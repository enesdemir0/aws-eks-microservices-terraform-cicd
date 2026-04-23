output "configure_kubectl" {
  description = "Run this command to configure kubectl for this cluster"
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster API server endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "ecr_registry" {
  description = "ECR registry base URL (prefix all image names with this)"
  value       = module.ecr.registry_url
}

output "ecr_repository_urls" {
  description = "Full ECR repository URLs per service"
  value       = module.ecr.repository_urls
}

output "rds_endpoint" {
  description = "RDS instance hostname (used in DATABASE_URL secrets)"
  value       = module.rds.db_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds.db_port
}

output "s3_bucket_name" {
  description = "S3 bucket name for image uploads"
  value       = module.s3.bucket_name
}

output "irsa_role_arn" {
  description = "IAM role ARN to annotate the visionmetric-worker Kubernetes service account"
  value       = module.irsa.role_arn
}

output "nat_gateway_ip" {
  description = "NAT Gateway Elastic IP — whitelist this in external services"
  value       = module.vpc.nat_gateway_ip
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "alb_controller_role_arn" {
  value = module.eks.alb_controller_role_arn
}