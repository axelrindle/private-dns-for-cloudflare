![Banner](./banner.png)

# Private DNS for Cloudflare Infrastructure

> Simple private DNS on Cloudflare ☁️

## Apps

### [(1) DNS/DDNS Worker](./apps/worker/)

A Cloudflare Worker with two purposes:

1. DNS-over-HTTPS (DoH)
2. Dynamic DNS (DDNS)

DNS Records are stored in a D1 database and can optionally be read dynamically from various sources (e.g. KV store).

DDNS functionality allows for mass-updating DNS records in multiple zones.

### [(2) Desktop Connector](./apps/desktop/)

A desktop app which connects to the DoH worker allowing you to resolve domains locally.

## License

[MIT](LICENSE)

Not affiliated with, endorsed by or sponsored by Cloudflare, Inc.
Cloudflare and the Cloudflare logo are trademarks of Cloudflare, Inc.
