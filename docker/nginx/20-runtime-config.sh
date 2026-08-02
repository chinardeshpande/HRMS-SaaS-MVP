#!/bin/sh
set -eu

: "${AURA_API_URL:?AURA_API_URL is required}"
: "${AURA_SOCKET_URL:?AURA_SOCKET_URL is required}"

case "$AURA_API_URL$AURA_SOCKET_URL" in
  *[!A-Za-z0-9:/._-]*)
    echo "Aura runtime URLs contain unsupported characters" >&2
    exit 1
    ;;
esac

envsubst '${AURA_API_URL} ${AURA_SOCKET_URL}' \
  < /etc/aurahrms/runtime-config.js.template \
  > /usr/share/nginx/html/runtime-config.js
