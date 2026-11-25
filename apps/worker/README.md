# DNS/DDNS Worker

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/axelrindle/private-dns-for-cloudflare.git)

Cloudflare Worker that serves private DNS records over DNS-over-HTTPS (DoH) and updates public DNS records on Cloudflare when your IPv6 address changes (DDNS).

Built with [Hono](https://hono.dev), records live in a D1 database, the last known IPv6 address in a KV namespace.

## Endpoints

| Method | Path               | Auth              | Purpose                                                        |
| ------ | ------------------ | ----------------- | -------------------------------------------------------------- |
| `POST` | `/dns/query`       | `AUTH_TOKEN_DNS`  | DoH query, body in wire format (`application/dns-message`)     |
| `GET`  | `/.well-known/info`| `AUTH_TOKEN_DNS`  | Build info, echoes the `Cfpd-Nonce` header (UUIDv7)            |
| `POST` | `/ddns/update`     | `AUTH_TOKEN_DDNS` | Patch DNS records in one or more Cloudflare zones              |
| `GET`  | `/ddns/get`        | `AUTH_TOKEN_DDNS` | Last IPv6 address sent to `/ddns/update`, `404` if none yet    |
| `GET`  | `/api/v1.html`     | none              | API reference (Scalar), only with `APP_ENV=development`        |
| `GET`  | `/api/v1.json`     | none              | OpenAPI document, only with `APP_ENV=development`              |

All authenticated routes expect `Authorization: Bearer <token>`. Requests time out after 5 seconds.

The [desktop app](../desktop/) uses `/.well-known/info` to verify an endpoint during setup and `/dns/query` to forward lookups.

## DNS records

Records are rows in the `dns_records` table:

| Column    | Type    | Notes                                        |
| --------- | ------- | -------------------------------------------- |
| `type`    | text    | `A`, `AAAA`, `CNAME` or `TXT`                |
| `name`    | text    | Fully qualified name, unique, e.g. `nas.home`|
| `content` | text    | Record value or a dynamic reference (below)  |
| `ttl`     | integer | Optional, defaults to 300 seconds            |

Resolution rules:

- Names are matched exactly. There are no wildcards and only one record per name.
- Unknown names are answered with `REFUSED`.
- If the record type matches the query type, the record is returned.
- A `CNAME` record is returned for any query type. The worker does not resolve the target itself.
- If the name exists but the type does not match, the answer is empty (`NOERROR`, NODATA).
- Malformed queries get `FORMERR`, internal errors `SERVFAIL`.

### Dynamic content

If `content` has the form `::kv::<key>`, the value is read from the KV namespace at query time. When the key is missing, the literal content is returned.

`/ddns/update` writes the current address to the key `publicIpv6Address`. A record that always points to your current IPv6 address therefore looks like this:

```sql
INSERT INTO dns_records (type, name, content) VALUES ('AAAA', 'router.home', '::kv::publicIpv6Address');
```

### Adding records

There is no admin API. Insert rows with the `cf` CLI (needs Node.js, takes the database ID from `cloudflare.env`):

```sh
# local development database
bunx cf d1 raw <D1_DATABASE_ID> --local \
  --sql "INSERT INTO dns_records (type, name, content, ttl) VALUES ('A', 'nas.home', '192.168.1.10', 60)"

# production database
bunx cf d1 raw <D1_DATABASE_ID> --sql "..."
```

## DDNS

`POST /ddns/update` takes the new IPv6 address and the records to patch, grouped by zone:

```sh
curl -X POST https://dns.example.org/ddns/update \
  -H "Authorization: Bearer $AUTH_TOKEN_DDNS" \
  -H 'Content-Type: application/json' \
  -d '{
    "ipv6": "2001:db8::1",
    "zones": [
      {
        "zoneId": "<cloudflare zone id>",
        "token": "<cloudflare api token with DNS edit permission for this zone>",
        "records": ["<dns record id>", "<dns record id>"]
      }
    ]
  }'
```

- `records` are Cloudflare DNS record IDs, not names. Only the content is patched, so use it for `AAAA` records.
- Zones are processed in order through the [batch API](https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/batch/). The first failing zone aborts the request with `400` and the Cloudflare response in `meta`. Zones processed before that stay updated.
- On success the address is stored in KV and a message is sent to the configured Telegram chat.

## Configuration

### Secrets (`.dev.vars`, `.dev.vars.production`)

| Variable             | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `APP_ENV`            | `development` enables the API reference routes       |
| `AUTH_TOKEN_DNS`     | Bearer token for `/dns/query` and `/.well-known/info`|
| `AUTH_TOKEN_DDNS`    | Bearer token for `/ddns/*`                           |
| `TELEGRAM_BOT_TOKEN` | Bot that sends the DDNS notification                 |
| `TELEGRAM_CHAT_ID`   | Chat that receives it                                |

Use two different tokens for DNS and DDNS. The DNS token ends up on every client machine, the DDNS token can change public records.

### Bindings and domain (`cloudflare.env`, `cloudflare.env.production`)

The Worker is configured in `cloudflare.config.ts`. It loads `cloudflare.env` and `cloudflare.env.production` (the latter wins) and reads these `CF_`-prefixed variables:

| Variable            | Used for              | Example                                 |
| ------------------- | --------------------- | --------------------------------------- |
| `CF_ROUTE_DOMAIN`   | Custom domain         | `dns.example.org`                       |
| `CF_D1_DATABASE_ID` | D1 binding `db`       | ID from `cf d1 create`                  |
| `CF_KV_DATABASE_ID` | KV binding `kv`       | ID from `cf kv namespaces create`       |

A missing variable aborts `dev`, `build` and `deploy` with an error. The custom domain needs no zone, Cloudflare derives it from the hostname.

## Development

Requirements: [Bun](https://bun.sh) and Node.js 24.

```sh
bun install
cp .dev.vars.example .dev.vars        # set APP_ENV=development and tokens
cp cloudflare.env.example cloudflare.env
bun run cf-typegen                    # generates .cloudflare/types/index.d.ts (Env)

bun run db:migrate                    # apply migrations to the local D1 database

bun run dev                           # Vite dev server with a self-signed HTTPS certificate
```

The desktop app accepts the self-signed certificate if "Skip TLS verification" is enabled.

| Script                  | Purpose                                     |
| ----------------------- | ------------------------------------------- |
| `bun run test`          | Vitest in the Workers runtime               |
| `bun run lint`          | ESLint (`lint:fix` to fix)                  |
| `bun run build`         | Production bundle in `.cloudflare/output/`  |
| `bun run db:generate`   | New migration after changing the schema     |
| `bun run db:migrate`    | Apply migrations to the local D1 database   |
| `bun run db:migrate:remote` | Apply migrations to the remote D1 database |

The schema is defined in [src/db/schema](src/db/schema/). Local state (D1, KV) lives in `.cloudflare/state`. The migration scripts call `cf d1 migrations apply` with `--dir drizzle --pattern 'drizzle/*/migration.sql'` and take the database ID from `CF_D1_DATABASE_ID`. `db:studio` talks to the remote D1 database over HTTP and needs `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_DATABASE_ID` and `CLOUDFLARE_D1_TOKEN` in the environment (e.g. in a `.env` file).

## Deployment

1. Create the resources:
   ```sh
   bunx cf d1 create --name private-dns
   bunx cf kv namespaces create --title private-dns
   ```
2. Put their IDs and the custom domain into `cloudflare.env.production`.
3. Put the production secrets into `.dev.vars.production`.
4. Apply the migrations to the remote database (`bun run db:migrate:remote`).
5. Deploy:
   ```sh
   bun run deploy
   ```

`deploy` runs `cf deploy`, which builds the bundle and uploads the secrets from `.dev.vars.production` together with the Worker. Secrets are declared with `bindings.secret()` in `cloudflare.config.ts`. `cf` needs Node.js and its own login (`bunx cf auth login`).

CI ([worker.yml](../../.github/workflows/worker.yml)) runs lint, tests and build on every change below `apps/worker`. It does not deploy.
