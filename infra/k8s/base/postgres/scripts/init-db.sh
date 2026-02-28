#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE DATABASE intheblack_kratos OWNER intheblack;
    CREATE DATABASE intheblack_hydra OWNER intheblack;
    CREATE DATABASE intheblack_keto OWNER intheblack;
EOSQL
