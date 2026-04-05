#!/bin/sh
set -e

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__APP_CONFIG__ = {
  PAYMENT_URL: "${PAYMENT_URL:-}"
};
EOF

exec /docker-entrypoint.sh "$@"
