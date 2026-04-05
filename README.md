<div align="center">
  <a href="https://github.com/necko-moe/necko3-frontend">
    <img src=".github/static/necko3-3-1-round.png" alt="necko3-3-1-round.png" width="256"/>
  </a>
  <h1>necko3-frontend</h1>

  <a href="https://github.com/necko-moe/necko3-frontend/stargazers">
    <img src="https://img.shields.io/github/stars/necko-moe/necko3-frontend?style=social" alt="GitHub stars">
  </a>
</div>

***

## About

**necko3-frontend** is the pretty face of the [necko3](https://github.com/necko-moe) project — a single-page admin panel that lets you manage your self-hosted crypto payment gateway without touching a single `curl` command _(unless you're into that)_.

It talks exclusively to [necko3-backend](https://github.com/necko-moe/necko3-backend) endpoints that sit behind `X-API-Key` auth. Configure blockchains, add tokens, create invoices, watch payments roll in, and stalk your webhook deliveries — all from a warm, responsive UI that works just as well on your phone as it does on a 4K monitor.

The whole thing is a static SPA. No server-side rendering, no Node runtime in production, no hidden backend magic. Build it once, throw the output into any web server, and she takes it from there.

<!-- 
<div align="center">
  <img src=".github/static/getting-started.png" alt="getting started page" width="960"/>
</div>
 -->

### Features

- **Session-only API key auth** — the key lives in `sessionStorage` and dies with the tab. No cookies, no tokens, no "remember me" footguns.
- **Chain management** — add, edit, and delete blockchain networks. Configure your xpub, multiple RPC endpoints _(it will rotate through them if one goes down)_, confirmation thresholds, and block lag.
- **Token configuration** — attach ERC-20 tokens (USDC, USDT, whatever your chain supports) to any network. Set the contract address, decimals, and you're done.
- **Invoice lifecycle** — create invoices, monitor their status in real-time, cancel them if plans change, and generate [payment links](https://github.com/necko-moe/necko3-payment-page) for your customers.
- **Invoice card export** — generate a shareable PNG card for any invoice, complete with a QR code, payment details, and a choice of light/dark theme and language.
- **Payment tracking** — paginated, filterable list of every payment attempt. Drill into any row for on-chain details, block numbers, and confirmation progress.
- **Webhook inspector** — see every webhook delivery, its status, retry count, and next attempt time. Cancel pending jobs if your endpoint moved to a farm upstate.
- **Multilingual** — full i18n with English, Russian, Ukrainian, and Chinese. Language is auto-detected from the browser and can be switched on the fly.
- **Dark / light theme** — persisted in `localStorage`, applied before first paint _(no white flash of death in dark mode)_.
- **Fully responsive** — collapsible sidebar on desktop, sheet drawer on mobile. Looks good on everything from an iPhone SE to an ultrawide.
- **Static build output** — deploy anywhere: Nginx, Caddy, S3, a Raspberry Pi, that one server in your closet. If it can serve HTML, it can run this.

## Screenshots

(soon)

<!--
<div align="center">
  <table>
    <tr>
      <td><img src=".github/static/screenshot-auth-desktop.png" alt="auth gate dialogue" width="480"/></td>
      <td><img src=".github/static/screenshot-auth-mobile.png" alt="auth gate dialogue" width="240"/></td>
    </tr>
    <tr>
      <td><img src=".github/static/screenshot-chains.png" alt="chains page" width="480"/></td>
      <td><img src=".github/static/screenshot-invoices.png" alt="invoices page" width="480"/></td>
    </tr>
    <tr>
      <td><img src=".github/static/screenshot-payments.png" alt="webhooks/payments page" width="480"/></td>
      <td><img src=".github/static/screenshot-mobile.png" alt="something on mobile" width="240"/></td>
    </tr>
  </table>
</div>
-->

## Tech Stack

| Layer | What |
|-------|------|
| UI | React 19, TypeScript 5.9 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Components | shadcn/ui + Radix UI |
| Routing | react-router 7 |
| State | Zero libraries — React Context + URL search params |
| Fonts & Icons | Geist, Lucide |
| Toasts | Sonner |
| i18n | i18next + react-i18next |
| Dates | date-fns |
| QR Codes | qr-code-styling |
| Image Export | modern-screenshot |

## Pages

| Route | What it does |
|-------|-------------|
| `/getting-started` | Onboarding wizard: three steps from zero to first invoice. Also doubles as the "what is necko3?" page. |
| `/chains` | Master-detail view for blockchain networks. Add a chain, configure RPCs, manage tokens — all without leaving the page. |
| `/invoices` | Paginated invoice list with status/network/token filters. Create new invoices, view details, cancel, and copy payment links. |
| `/payments` | Every payment attempt the system has seen. Filter by status, network, token, invoice, sender address, or block number. |
| `/webhooks` | Webhook delivery log. Filter by status, event type, invoice, or URL. Inspect payloads, cancel stuck jobs. |

## Installing and Launching

### 1. Preparation

Make sure Docker is installed, then grab the compose file:
```bash
# Install Docker if not already installed
sudo curl -fsSL https://get.docker.com | sh

# Create working directory
mkdir /opt/necko3-frontend && cd /opt/necko3-frontend

# Grab the compose file
curl -o docker-compose.yml https://raw.githubusercontent.com/necko-moe/necko3-frontend/refs/heads/main/docker-compose.yml
```

### 2. Configuration (.env)

```bash
curl -o .env https://raw.githubusercontent.com/necko-moe/necko3-frontend/refs/heads/main/.env.example
```

Open `.env` and fill in two values:

| Variable | Description |
|----------|-------------|
| `BACKEND_URL` | Full URL to your [necko3-backend](https://github.com/necko-moe/necko3-backend) instance (e.g. `https://api.necko.moe`). The admin panel sends every API call here via nginx reverse proxy. |
| `PAYMENT_URL` | Full URL to your [necko3-payment-page](https://github.com/necko-moe/necko3-payment-page) instance (e.g. `https://payment.necko.moe`). Used to generate customer-facing payment links. |

Both values are injected at container startup — no rebuild needed when they change.

### 3. Launch

```bash
docker compose up -d && docker compose logs -f -t
```

The panel will be available on `127.0.0.1:3636`.

### 4. TLS / Reverse Proxy

The container binds to **localhost only** — it does not expose itself to the internet by default. Set up a reverse proxy (Nginx, Caddy, Traefik — whatever your soul desires) with TLS certificates pointing to `127.0.0.1:3636`.

Or just expose the port to the world if plaintext HTTP and the total absence of encryption don't bother you _(please let them bother you)_.

<details>
<summary>What the <code>docker-compose.yml</code> looks like</summary>

```yaml
services:
  frontend:
    image: ghcr.io/necko-moe/necko3-frontend:latest
    container_name: necko3-frontend
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:3636:80"
```
</details>

## Development

If you want to hack on the UI or just enjoy `npm run dev` more than Docker:

```bash
git clone https://github.com/necko-moe/necko3-frontend.git
cd necko3-frontend
npm install

cp .env.example .env
nano .env # Rename BACKEND_URL to VITE_BACKEND_URL, PAYMENT_URL to VITE_PAYMENT_URL and fill them in

npm run dev
```

Dev server starts on `http://localhost:5173`. To produce a production build:

```bash
npm run build
```

Static output lands in `dist/` — serve it however you like.

## Contributing

I'd be happy to see any feedback.<br />
Found a bug? <a href=https://github.com/necko-moe/necko3-frontend/issues/new>Open an Issue</a>.<br />
Want to add a feature? Fork it and send a PR.

## License

The project and all repositories are distributed under the **MIT License**. Feel free to use, modify, and distribute <3

* * *

<div align="center">
  <h1>SUPPORT PROJECT</h1>
  <p>Want to make necko1 employed or donate enough for a Triple Whopper? Contact me -> <a href=https://t.me/everyonehio>Telegram</a> or <a href="mailto:meow@necko.moe">Mail me</a> (I rarely check that). I don't accept direct card transfers, just so you know</p>
  <p>
    Broke but still want to help?
    You can just <a href="https://github.com/necko-moe/necko3-frontend/stargazers"><b>⭐ Star this repo</b></a> to show your love. It really helps!
  </p>
  <a href="https://github.com/necko-moe">
    <img src=".github/static/necko3-2-200.png" alt="necko3 support banner" width="1024"/>
  </a>
</div>
