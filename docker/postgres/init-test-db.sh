# filepath: c:\Users\priya\Projects\eDrop-UrbanHive\edrop-wms\docker\postgres\init-test-db.sh
#!/bin/bash
set -e

# Use the correct variable name DB_TEST_DATABASE, which is passed from docker-compose.yml
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE "${DB_TEST_DATABASE}"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_TEST_DATABASE}')\gexec
EOSQL