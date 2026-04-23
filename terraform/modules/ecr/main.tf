resource "aws_ecr_repository" "repos" {
  for_each     = toset(var.service_names)
  name         = each.key
  force_delete = true  # Ensures `terraform destroy` removes all images

  image_scanning_configuration { scan_on_push = true }

  tags = { Service = each.key }
}

# Keep only the 5 most recent images per repo to limit storage costs
resource "aws_ecr_lifecycle_policy" "repos" {
  for_each   = aws_ecr_repository.repos
  repository = each.value.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 5 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 5
      }
      action = { type = "expire" }
    }]
  })
}
