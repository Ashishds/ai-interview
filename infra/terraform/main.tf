# ============================================================
# HireAI — AWS Infrastructure (Terraform)
# Provisions: VPC, ECS Fargate, ElastiCache, S3, SES, ALB
# ============================================================

terraform {
  required_version = ">= 1.6.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.30"
    }
  }
  backend "s3" {
    bucket = "hireai-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "ap-south-1"
  }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "HireAI"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Variables
variable "aws_region"   { default = "ap-south-1" }
variable "environment"  { default = "prod" }
variable "app_name"     { default = "hireai" }

# ─── VPC ─────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "${var.app_name}-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${var.app_name}-igw" }
}

resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags                    = { Name = "${var.app_name}-public-${count.index + 1}" }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags              = { Name = "${var.app_name}-private-${count.index + 1}" }
}

data "aws_availability_zones" "available" {}

# ─── Security Groups ─────────────────────────────────────────
resource "aws_security_group" "alb" {
  name   = "${var.app_name}-alb-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 80  to_port = 80  protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }
  ingress { from_port = 443 to_port = 443 protocol = "tcp" cidr_blocks = ["0.0.0.0/0"] }
  egress  { from_port = 0   to_port = 0   protocol = "-1"  cidr_blocks = ["0.0.0.0/0"] }
}

resource "aws_security_group" "ecs" {
  name   = "${var.app_name}-ecs-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 8000 to_port = 8000 protocol = "tcp" security_groups = [aws_security_group.alb.id] }
  egress  { from_port = 0    to_port = 0    protocol = "-1"  cidr_blocks     = ["0.0.0.0/0"] }
}

resource "aws_security_group" "redis" {
  name   = "${var.app_name}-redis-sg"
  vpc_id = aws_vpc.main.id
  ingress { from_port = 6379 to_port = 6379 protocol = "tcp" security_groups = [aws_security_group.ecs.id] }
}

# ─── ECR — Container Registry ────────────────────────────────
resource "aws_ecr_repository" "backend" {
  name                 = "${var.app_name}-backend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

# ─── ECS Cluster ─────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
  setting { name = "containerInsights" value = "enabled" }
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.app_name}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "1024"   # 1 vCPU
  memory                   = "2048"   # 2 GB RAM
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "backend"
    image     = "${aws_ecr_repository.backend.repository_url}:latest"
    essential = true
    portMappings = [{ containerPort = 8000 protocol = "tcp" }]
    
    environment = [
      { name = "APP_ENV", value = var.environment },
    ]
    
    secrets = [
      { name = "OPENAI_API_KEY",      valueFrom = aws_ssm_parameter.openai_key.arn },
      { name = "SUPABASE_URL",        valueFrom = aws_ssm_parameter.supabase_url.arn },
      { name = "SUPABASE_SERVICE_KEY", valueFrom = aws_ssm_parameter.supabase_key.arn },
      { name = "SECRET_KEY",          valueFrom = aws_ssm_parameter.jwt_secret.arn },
      { name = "REDIS_URL",           valueFrom = aws_ssm_parameter.redis_url.arn },
    ]
    
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = "/ecs/${var.app_name}-backend"
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "ecs"
      }
    }

    healthCheck = {
      command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval    = 30
      timeout     = 10
      retries     = 3
      startPeriod = 30
    }
  }])
}

resource "aws_ecs_service" "backend" {
  name            = "${var.app_name}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 8000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
}

# ─── Application Load Balancer ───────────────────────────────
resource "aws_lb" "main" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "backend" {
  name        = "${var.app_name}-backend-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    interval            = 30
    timeout             = 10
  }
}

# ─── ElastiCache Redis ───────────────────────────────────────
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.app_name}-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "${var.app_name}-redis"
  description                = "HireAI Redis Cluster"
  node_type                  = "cache.t3.small"
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  engine_version             = "7.0"
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}

# ─── S3 — Resume & Recording Storage ─────────────────────────
resource "aws_s3_bucket" "uploads" {
  bucket = "${var.app_name}-uploads-${var.environment}"
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket                  = aws_s3_bucket.uploads.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ─── SSM Parameters (Secrets) ────────────────────────────────
resource "aws_ssm_parameter" "openai_key" {
  name  = "/${var.app_name}/${var.environment}/OPENAI_API_KEY"
  type  = "SecureString"
  value = "PLACEHOLDER_SET_VIA_CONSOLE_OR_CLI"
  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "supabase_url" {
  name  = "/${var.app_name}/${var.environment}/SUPABASE_URL"
  type  = "SecureString"
  value = "PLACEHOLDER_SET_VIA_CONSOLE_OR_CLI"
  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "supabase_key" {
  name  = "/${var.app_name}/${var.environment}/SUPABASE_SERVICE_KEY"
  type  = "SecureString"
  value = "PLACEHOLDER_SET_VIA_CONSOLE_OR_CLI"
  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/${var.app_name}/${var.environment}/SECRET_KEY"
  type  = "SecureString"
  value = "PLACEHOLDER_SET_VIA_CONSOLE_OR_CLI"
  lifecycle { ignore_changes = [value] }
}

resource "aws_ssm_parameter" "redis_url" {
  name  = "/${var.app_name}/${var.environment}/REDIS_URL"
  type  = "SecureString"
  value = "rediss://${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
}

# ─── IAM Roles ───────────────────────────────────────────────
resource "aws_iam_role" "ecs_execution" {
  name = "${var.app_name}-ecs-execution"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.app_name}-ecs-task"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_policy" {
  name = "${var.app_name}-ecs-task-policy"
  role = aws_iam_role.ecs_task.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = "${aws_s3_bucket.uploads.arn}/*"
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/${var.app_name}/*"
      }
    ]
  })
}

# ─── Outputs ─────────────────────────────────────────────────
output "alb_dns_name"          { value = aws_lb.main.dns_name }
output "ecr_repository_url"    { value = aws_ecr_repository.backend.repository_url }
output "redis_endpoint"        { value = aws_elasticache_replication_group.redis.primary_endpoint_address }
output "s3_bucket_name"        { value = aws_s3_bucket.uploads.id }
