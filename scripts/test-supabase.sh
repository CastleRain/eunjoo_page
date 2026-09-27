#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container="ondam-sql-test-$$"
trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT
docker run --rm -d --name "$container" -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine >/dev/null
# The image starts a socket-only temporary server during init. Wait for TCP
# so the readiness probe cannot succeed before that temporary server stops.
ready=false
for i in {1..30}; do
  if docker exec "$container" pg_isready -h 127.0.0.1 -U postgres >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
if [ "$ready" != true ]; then echo 'PostgreSQL did not become ready'; exit 1; fi
docker exec -i "$container" psql -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1 < supabase/tests/bootstrap.sql
for migration in supabase/migrations/*.sql; do
  docker exec -i "$container" psql -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1 < "$migration"
done
docker exec -i "$container" psql -h 127.0.0.1 -U postgres -v ON_ERROR_STOP=1 < supabase/tests/leave.sql
