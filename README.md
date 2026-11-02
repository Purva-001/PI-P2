# Taskflow

Taskflow is a serverless student task manager built for the IaC mini project. The frontend and REST API run on a Cloudflare Worker, while task records are persisted in a Cloudflare Workers KV namespace provisioned by Terraform.

## Project structure

```text
application/          Worker, HTML, CSS, and browser JavaScript
terraform/            Cloudflare provider, KV namespace, variables, and outputs
.github/workflows/    Validate, plan, and deploy workflow
```

## Run locally

The static application can be opened directly from `application/index.html`. For an end-to-end local Worker preview, install Wrangler and run:

```bash
npx wrangler dev application/worker.js
```

For a real deployment, Terraform provisions the KV namespace and Wrangler publishes the Worker and static application assets. The deploy command below injects the Terraform output into a temporary copy of `wrangler.toml`.

The Worker serves the UI and exposes:

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Terraform deployment

1. Install Node.js 20+, Terraform 1.6+, and Wrangler (`npm install --global wrangler`).
2. Set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in your shell.
3. Copy `terraform/terraform.tfvars.example` to `terraform/terraform.tfvars` and set your account ID.
4. From `AK-P2/terraform/`, run `terraform init`, `terraform fmt -check`, `terraform validate`, `terraform plan`, and `terraform apply`.
5. From `AK-P2/`, create a deploy-only config and publish the Worker:

   ```powershell
   $kvId = terraform -chdir=terraform output -raw kv_namespace_id
   (Get-Content wrangler.toml) -replace 'replace-with-terraform-output', $kvId | Set-Content wrangler.deploy.toml
   npx wrangler deploy --config wrangler.deploy.toml
   Remove-Item wrangler.deploy.toml
   ```

   The deploy command prints the public `workers.dev` URL. Do not commit `wrangler.deploy.toml`.

The API token should have the minimum Workers and Workers KV permissions required by the Cloudflare provider. Never commit `terraform.tfvars` or state files.

## CI/CD

The repository-level workflow in `.github/workflows/ak-p2-deploy.yml` runs formatting checks, validation, a plan, and an apply on pushes to `main`. It then injects the provisioned KV ID into a temporary config and deploys the Worker and assets. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets before enabling deployment. The copy at `.github/workflows/deploy.yml` keeps AK-P2 portable if it becomes a standalone repository.
