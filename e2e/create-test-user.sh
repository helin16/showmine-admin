#!/bin/bash
# Run this yourself, once: bash e2e/create-test-user.sh you+e2e@example.com
# Creates the E2E user in test company and saves the login to e2e/.env.local.
set -euo pipefail
EMAIL="${1:?Usage: bash e2e/create-test-user.sh you+e2e@example.com}"
HOST="${SHOWMINE_API_HOST:?Set SHOWMINE_API_HOST to the API server address}"
ENV_FILE="$(dirname "$0")/.env.local"
[ ! -e "$ENV_FILE" ] || { echo "$ENV_FILE already exists. Nothing changed."; exit 1; }
PASSWORD="$(openssl rand -base64 24 | tr -d '/+=\n')"

REMOTE=$(cat <<'R'
set -euo pipefail
read -r EMAIL
read -r PASSWORD
cd /var/www/showmine-api/current
HASH=$(printf %s "$PASSWORD" | sudo -u showmine /opt/node-v26.13.0/bin/node -e "const b=require('bcrypt');console.log(b.hashSync(require('fs').readFileSync(0,'utf8'),b.genSaltSync(10)))")
cd /tmp
sudo -u postgres psql -d showmine -q -At -v ON_ERROR_STOP=1 -v email="$EMAIL" -v hash="$HASH" <<'SQL'
BEGIN;
-- Stops the transaction if the email is already taken.
SELECT 1 / (SELECT CASE WHEN count(*) > 0 THEN 0 ELSE 1 END FROM users WHERE lower(email) = lower(:'email'));
WITH company AS (
  SELECT id, "createdById" FROM companies WHERE id = 'b3f1fdbd-c990-493b-aedc-0f0776badf59' AND name = 'test company'
), new_user AS (
  -- Opted out: notices would reach this inbox on every E2E publish.
  INSERT INTO users (id, "createdById", "updatedById", "firstName", "lastName", "nickName", email, password, "emailOptOut")
  SELECT gen_random_uuid(), "createdById", "createdById", 'E2E', 'Test', 'E2E Test', :'email', :'hash', true FROM company
  RETURNING id, "createdById"
)
INSERT INTO "companyUsers" (id, "createdById", "updatedById", "userId", "companyId", role, "isPending")
SELECT gen_random_uuid(), n."createdById", n."createdById", n.id, 'b3f1fdbd-c990-493b-aedc-0f0776badf59', 'ADMIN', false
FROM new_user n;
COMMIT;
SQL
echo created
R
)

printf '%s\n%s\n' "$EMAIL" "$PASSWORD" | ssh "root@$HOST" "$REMOTE"
umask 077
printf 'E2E_EMAIL=%s\nE2E_PASSWORD=%s\nE2E_COMPANY_NAME=test company\n' "$EMAIL" "$PASSWORD" > "$ENV_FILE"
echo "Saved the login to $ENV_FILE"
