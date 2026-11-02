output "worker_name" {
  description = "Deployed Cloudflare Worker name."
  value       = var.worker_name
}

output "kv_namespace_id" {
  description = "Workers KV namespace ID."
  value       = cloudflare_workers_kv_namespace.tasks.id
}
