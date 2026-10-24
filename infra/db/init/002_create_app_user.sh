#!/bin/bash
set -euo pipefail

: "${BOOQI_DB_USER:?BOOQI_DB_USER is required}" "${BOOQI_DB_PASSWORD:?BOOQI_DB_PASSWORD is required}"

# The values are interpolated into SQL string literals, so a quote would break (or inject into) the statement.
case "$BOOQI_DB_USER$BOOQI_DB_PASSWORD" in
    *"'"*) echo "BOOQI_DB_USER and BOOQI_DB_PASSWORD must not contain a single quote" >&2; exit 1 ;;
esac

mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE USER IF NOT EXISTS '${BOOQI_DB_USER}'@'%' IDENTIFIED BY '${BOOQI_DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`user\`.* TO '${BOOQI_DB_USER}'@'%';
GRANT ALL PRIVILEGES ON \`event\`.* TO '${BOOQI_DB_USER}'@'%';
GRANT ALL PRIVILEGES ON \`booking\`.* TO '${BOOQI_DB_USER}'@'%';
GRANT ALL PRIVILEGES ON \`payment\`.* TO '${BOOQI_DB_USER}'@'%';
FLUSH PRIVILEGES;
SQL
