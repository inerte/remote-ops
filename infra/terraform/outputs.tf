output "workers_script_name" {
  description = "Worker service name that serves the built SPA assets."
  value       = cloudflare_workers_script.remote_ops.script_name
}

output "production_hostname" {
  description = "Hostname attached to the Worker via Cloudflare custom domain routing."
  value       = cloudflare_workers_custom_domain.production.hostname
}

output "workers_custom_domain_id" {
  description = "Cloudflare identifier for the provisioned Worker custom domain."
  value       = cloudflare_workers_custom_domain.production.id
}
