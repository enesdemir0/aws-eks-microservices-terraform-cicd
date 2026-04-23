# ── Subnet Group (requires 2+ AZs) ───────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name        = "${var.project_name}-db-subnet-group"
  subnet_ids  = var.private_subnet_ids
  description = "Private subnet group for VisionMetric RDS"

  tags = { Name = "${var.project_name}-db-subnet-group" }
}

# ── Security Group ────────────────────────────────────────────────────────────

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-rds-sg"
  description = "Allow PostgreSQL traffic from EKS nodes only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL from EKS nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.node_sg_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${var.project_name}-rds-sg" }
}

# ── Single RDS Instance (Free Tier) ──────────────────────────────────────────
# One db.t3.micro hosts both auth_db and metadata_db as logical PostgreSQL
# databases. The initial DB is auth_db; the deploy workflow creates metadata_db.

resource "aws_db_instance" "main" {
  identifier        = "${var.project_name}-postgres"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  storage_type      = "gp2"

  db_name  = "auth_db"
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Free Tier / FinOps settings
  multi_az                    = false
  publicly_accessible         = false
  backup_retention_period     = 1
  delete_automated_backups    = true
  skip_final_snapshot         = true
  deletion_protection         = false
  apply_immediately           = true
  performance_insights_enabled = false

  tags = { Name = "${var.project_name}-postgres" }
}
