#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
container="ondam-sql-test-$$"
trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT
docker run --rm -d --name "$container" -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17-alpine >/dev/null
ready=false
for i in {1..30}; do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
if [ "$ready" != true ]; then echo 'PostgreSQL did not become ready'; exit 1; fi
docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/bootstrap.sql
for migration in supabase/migrations/*.sql; do
  docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < "$migration"
done
docker exec -i "$container" psql -U postgres -v ON_ERROR_STOP=1 < supabase/tests/leave.sql
