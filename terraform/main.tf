module "vpc" {
  source       = "./modules/vpc"
  project_name = var.project_name
  environment  = var.environment
}

module "eks" {
  source       = "./modules/eks"
  project_name = var.project_name
  environment  = var.environment

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  cluster_version    = var.eks_cluster_version
  node_instance_type = var.node_instance_type
  node_desired_count = var.node_desired_count
  node_min_count     = var.node_min_count
  node_max_count     = var.node_max_count
}

module "rds" {
  source       = "./modules/rds"
  project_name = var.project_name
  environment  = var.environment

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_sg_id         = module.eks.node_security_group_id

  db_username = var.db_username
  db_password = var.db_password
}

module "s3" {
  source       = "./modules/s3"
  project_name = var.project_name
  environment  = var.environment
}

module "ecr" {
  source        = "./modules/ecr"
  project_name  = var.project_name
  environment   = var.environment
  service_names = ["auth-service", "gateway", "ai-worker", "metadata-api", "frontend"]
}

module "irsa" {
  source       = "./modules/irsa"
  project_name = var.project_name
  environment  = var.environment

  oidc_provider_arn    = module.eks.oidc_provider_arn
  oidc_provider_url    = module.eks.oidc_provider_url
  s3_bucket_arn        = module.s3.bucket_arn
  k8s_namespace        = var.k8s_worker_namespace
  k8s_service_account = "visionmetric-worker"
}
