variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Worker."
  type        = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Workers and KV permissions."
  type        = string
  sensitive   = true
}

variable "worker_name" {
  description = "Name of the deployed Worker."
  type        = string
  default     = "student-task-manager"
}

variable "kv_namespace_name" {
  description = "Name of the Workers KV namespace."
  type        = string
  default     = "student_tasks"
}

variable "environment" {
  description = "Deployment environment label."
  type        = string
  default     = "production"
}

