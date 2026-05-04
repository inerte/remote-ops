# Cloudflare production Terraform

This module provisions the production Worker and custom domain for Remote Ops.

## From the repo root

1. Install tooling once:
   - `npm install`
   - `npm --prefix web install`
2. Build the web app:
   - `npm run build:web`
3. Copy the example variables file:
   - `cp -f infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars`
4. Fill in the Cloudflare token, account, zone, and hostname values.
5. Run Terraform:
   - `npm run tf:init`
   - `npm run tf:plan`
   - `npm run tf:apply`

## Notes

- The Worker upload reads built assets from `../../web/dist`, so rebuild before `plan` or `apply` when the app changes.
- Local/manual preview and deploy stay on Wrangler:
  - `npm run cf:dev`
  - `npm run cf:deploy`
