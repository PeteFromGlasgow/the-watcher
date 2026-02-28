#!/bin/sh

# This script creates an OAuth 2.0 client in Hydra for the CLI if it doesn't already exist, using curl.

CLIENT_ID="cli"
ENDPOINT="http://localhost:4445/admin"

# Check if the client already exists
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$ENDPOINT/clients/$CLIENT_ID")

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "OAuth client '$CLIENT_ID' already exists. Skipping creation."
  exit 0
fi

# Create the client
curl -s -X POST \
  -H "Content-Type: application/json" \
  --data '{
    "client_id": "cli",
    "client_secret": "cli-secret",
    "grant_types": ["authorization_code", "refresh_token"],
    "response_types": ["code", "id_token"],
    "scope": "openid offline",
    "redirect_uris": ["http://localhost:4567/callback"]
  }' \
  "$ENDPOINT/clients"

echo "OAuth client '$CLIENT_ID' created successfully."
