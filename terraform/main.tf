resource "cloudflare_workers_kv_namespace" "tasks" {
  account_id = var.cloudflare_account_id
  title      = "${var.kv_namespace_name}-${var.environment}"
}
