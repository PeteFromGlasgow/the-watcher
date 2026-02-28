#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE watcher_kratos OWNER watcher;
    CREATE DATABASE watcher_hydra OWNER watcher;
    CREATE DATABASE watcher_keto OWNER watcher;
EOSQL
