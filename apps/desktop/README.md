# Desktop Connector

Desktop app that runs a local DNS forwarder and sends lookups for one private domain (e.g. `home`) to the [DNS worker](../worker/) over DNS-over-HTTPS. All other lookups keep using your regular DNS.

Built with [Wails 3](https://v3.wails.io) (Go backend) and React, TanStack Router/Query and Tailwind in the frontend.

## How it works

1. The forwarder listens on `127.0.0.1` and `::1` (UDP and TCP) on a local port, default `15353`.
2. Each query is sent unchanged as `POST <endpoint>/dns/query` with the configured bearer token. The worker's answer goes back to the client as is.
3. On macOS the app writes `/etc/resolver/<domain>` (see `man 5 resolver`), so the system sends lookups for `<domain>` and every name below it to the forwarder:
   ```
   nameserver 127.0.0.1
   nameserver ::1
   port 15353
   ```
   Writing this file needs root, so the app asks for the admin password whenever domain or port change and when the app is reset.

> [!NOTE]
> The resolver integration exists only on macOS. On Windows and Linux the forwarder runs, but you have to point your system resolver at it yourself.

## Features

- Setup wizard: endpoint, token, optional "Skip TLS verification", port and domain. The endpoint is verified before saving: the app calls `/.well-known/info` with a random UUIDv7 nonce and expects it back.
- Tray icon that shows whether the forwarder is running. The tray menu toggles it, a click opens the window. Closing the window only hides it.
- Chart with queries per record type for each minute of the last hour (kept in memory only).
- Autostart on login.
- Reset: removes the resolver file, stops the forwarder, disables autostart and deletes config and statistics.

The configuration, including the token, is stored as JSON in the OS keyring (macOS Keychain, Windows Credential Manager, Secret Service on Linux) under the service name `de.axelrindle.cf-priv-dns`.

## Development

Requirements:

- Go (version from [go.mod](go.mod))
- [Bun](https://bun.sh)
- [Task](https://taskfile.dev)
- Wails 3 CLI, same version as in `go.mod`:
  ```sh
  go install "github.com/wailsapp/wails/v3/cmd/wails3@$(go list -m -f '{{.Version}}' github.com/wailsapp/wails/v3)"
  ```
- Linux only: `libgtk-4-dev`, `libwebkitgtk-6.0-dev`, `libsoup-3.0-dev`

```sh
cd frontend && bun install && cd ..
task dev        # runs wails3 dev with hot reload, Vite on port 9245 (WAILS_VITE_PORT)
```

| Task           | Purpose                                                        |
| -------------- | -------------------------------------------------------------- |
| `task build`   | Generates bindings and builds the binary into `bin/`           |
| `task package` | Builds the platform package (see below)                        |
| `task run`     | Runs the built app                                             |
| `task bindings`| Regenerates the TypeScript bindings in `frontend/src/gen/`     |
| `go test ./...`| Unit tests for config, DNS parsing, resolver and statistics    |

Set `GOOS` to cross-compile, e.g. `task build GOOS=windows`. Docker-based cross-compilation is prepared via `task setup:docker`.

### Project layout

```
main.go                 window, tray and service wiring
internal/config         config struct and validation
internal/dns            DoH forwarder (UDP/TCP listeners, HTTP client)
internal/resolver       /etc/resolver handling on macOS, no-op elsewhere
internal/service        services exposed to the frontend (DNS, keyring, stats, autostart, upstream check)
internal/stats          per-minute query counters
frontend/               React UI
build/                  Wails build config and platform packaging
```

## Packaging

`task package` produces:

| Platform | Output in `bin/`                                   |
| -------- | -------------------------------------------------- |
| macOS    | `.app` bundle                                      |
| Windows  | NSIS installer (`*-installer.exe`)                 |
| Linux    | AppImage, `.deb`, `.rpm`, `.pkg.tar.zst`           |

CI ([desktop.yml](../../.github/workflows/desktop.yml)) builds and packages all three platforms on every change below `apps/desktop` and uploads the results as workflow artifacts (kept for one day). The builds are not signed.

Product name, identifier and version are set in [build/config.yml](build/config.yml). After changing them run `wails3 task common:update:build-assets`.

## Known limitations

- The auto updater in [updater.go](updater.go) is not active yet.
- Only one domain can be configured.
