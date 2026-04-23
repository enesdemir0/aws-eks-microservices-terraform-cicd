output "registry_url" {
  description = "Base ECR registry (account.dkr.ecr.region.amazonaws.com)"
  value       = split("/", values(aws_ecr_repository.repos)[0].repository_url)[0]
}

output "repository_urls" {
  description = "Full repository URLs keyed by service name"
  value       = { for k, v in aws_ecr_repository.repos : k => v.repository_url }
}
