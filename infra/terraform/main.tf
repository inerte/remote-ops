provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

locals {
  built_assets_directory = abspath("${path.module}/${var.assets_directory}")
}

resource "cloudflare_workers_script" "remote_ops" {
  account_id         = var.cloudflare_account_id
  script_name        = var.workers_script_name
  compatibility_date = var.compatibility_date

  assets = {
    directory = local.built_assets_directory
    config = {
      not_found_handling = "single-page-application"
    }
  }
}

resource "cloudflare_workers_custom_domain" "production" {
  account_id = var.cloudflare_account_id
  zone_id    = var.cloudflare_zone_id
  hostname   = var.production_hostname
  service    = cloudflare_workers_script.remote_ops.script_name
}
