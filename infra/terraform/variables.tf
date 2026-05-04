variable "cloudflare_api_token" {
  description = "Cloudflare API token with Workers Scripts Write and zone access."
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the Worker."
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the production hostname."
  type        = string
}

variable "production_hostname" {
  description = "Hostname to attach to the production Worker custom domain."
  type        = string
}

variable "workers_script_name" {
  description = "Worker service name used for Remote Ops."
  type        = string
  default     = "remote-ops"
}

variable "compatibility_date" {
  description = "Compatibility date used by the Workers asset deployment."
  type        = string
  default     = "2025-05-04"
}

variable "assets_directory" {
  description = "Path to the built SPA assets, relative to infra/terraform."
  type        = string
  default     = "../../web/dist"
}
