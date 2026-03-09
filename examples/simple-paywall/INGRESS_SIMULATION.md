# Ingress Rewrite Simulation (Quick Reference)

From repo root:

```bash
docker compose -f examples/simple-paywall/docker-compose.yml -f examples/simple-paywall/docker-compose.ingress-sim.yml up -d --build
```

Open: `http://localhost:8099/x402-demo/try`

Quick checks:

```bash
curl -s http://localhost:8099/x402-demo/config.js
curl -si -H 'Accept: text/html' http://localhost:8099/x402-demo/api/protected/testnet | sed -n '1,25p'
```

Decode `PAYMENT-REQUIRED.resource.url`:

```bash
PAY=$(curl -si -H 'Accept: text/html' http://localhost:8099/x402-demo/api/protected/testnet | awk -F': ' 'tolower($1)=="payment-required"{print $2}' | tr -d '\r')
node -e "const o=JSON.parse(Buffer.from(process.argv[1],'base64').toString()); console.log(o.resource?.url)" "$PAY"
```

Stop:

```bash
docker compose -f examples/simple-paywall/docker-compose.yml -f examples/simple-paywall/docker-compose.ingress-sim.yml down
```
