#!/bin/sh
set -e

host="$1"
shift

# Wait for Postgres to be ready
until pg_isready -h "$host" -U "${DB_USER:-$POSTGRES_USER}"; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done

>&2 echo "Postgres is up - executing command"
# Preserve argv so constructs like: sh -c "alembic upgrade head && uvicorn ..." work
exec "$@"