# Optional reproducible local environment. Not Docker-tested on the delivery host.
FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV WRANGLER_SEND_METRICS=false
COPY package.json package-lock.json ./
RUN npm ci --include=dev --include=optional --no-audit --no-fund
COPY . .
RUN mkdir -p .sites-runtime && echo '{"executionProfile":"portable"}' > .sites-runtime/execution-profile.json && npm run build
EXPOSE 4173
CMD ["sh","-c","python3 scripts/bootstrap-local.py && node --import ./scripts/sites-env.mjs node_modules/wrangler/bin/wrangler.js dev --config dist/server/wrangler.json --local --persist-to .wrangler/state --ip 0.0.0.0 --inspector-port 0 --port 4173"]
