variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Project name prefix used in all resource names"
  type        = string
  default     = "visionmetric"
}

variable "environment" {
  description = "Deployment environment tag"
  type        = string
  default     = "production"
}

variable "eks_cluster_version" {
  description = "Kubernetes version for the EKS cluster"
  type        = string
  default     = "1.29"
}

variable "node_instance_type" {
  description = "EC2 instance type for EKS worker nodes (t3.medium is minimum for TensorFlow)"
  type        = string
  default     = "t3.medium"
}

variable "node_desired_count" {
  description = "Desired number of EKS worker nodes"
  type        = number
  default     = 2
}

variable "node_min_count" {
  description = "Minimum number of EKS worker nodes (scale-down floor)"
  type        = number
  default     = 1
}

variable "node_max_count" {
  description = "Maximum number of EKS worker nodes (hard cost cap)"
  type        = number
  default     = 2
}

variable "db_username" {
  description = "Master username for the RDS PostgreSQL instance"
  type        = string
  default     = "visionmetric"
}

variable "db_password" {
  description = "Master password for the RDS PostgreSQL instance"
  type        = string
  sensitive   = true
}

variable "k8s_worker_namespace" {
  description = "Kubernetes namespace where gateway and ai-worker pods run"
  type        = string
  default     = "visionmetric"
}
