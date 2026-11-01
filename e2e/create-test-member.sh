#!/bin/bash
# Run this yourself, once: bash e2e/create-test-member.sh you+e2e-member@example.com
# Creates a NORMAL user in test company only, adds the login to e2e/.env.local and prints it for the GitHub secrets.
set -euo pipefail
EMAIL="${1:?Usage: bash e2e/create-test-member.sh you+e2e-member@example.com}"
HOST="${SHOWMINE_API_HOST:?Set SHOWMINE_API_HOST to the API server address}"
ENV_FILE="$(dirname "$0")/.env.local"
! grep -qs '^E2E_MEMBER_EMAIL=' "$ENV_FILE" || { echo "$ENV_FILE already has a member. Nothing changed."; exit 1; }
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
-- Stops the transaction if the email is already taken, or if test company is missing.
SELECT 1 / (SELECT CASE WHEN count(*) > 0 THEN 0 ELSE 1 END FROM users WHERE lower(email) = lower(:'email'));
SELECT 1 / (SELECT count(*) FROM companies WHERE id = 'b3f1fdbd-c990-493b-aedc-0f0776badf59' AND name = 'test company');
WITH company AS (
  SELECT id, "createdById" FROM companies WHERE id = 'b3f1fdbd-c990-493b-aedc-0f0776badf59' AND name = 'test company'
), new_user AS (
  INSERT INTO users (id, "createdById", "updatedById", "firstName", "lastName", "nickName", email, password)
  SELECT gen_random_uuid(), "createdById", "createdById", 'E2E', 'Member', 'E2E Member', :'email', :'hash' FROM company
  RETURNING id, "createdById"
)
INSERT INTO "companyUsers" (id, "createdById", "updatedById", "userId", "companyId", role, "isPending")
SELECT gen_random_uuid(), n."createdById", n."createdById", n.id, 'b3f1fdbd-c990-493b-aedc-0f0776badf59', 'NORMAL', false
FROM new_user n;
COMMIT;
SQL
echo created
R
)

printf '%s\n%s\n' "$EMAIL" "$PASSWORD" | ssh "root@$HOST" "$REMOTE"
umask 077
printf 'E2E_MEMBER_EMAIL=%s\nE2E_MEMBER_PASSWORD=%s\n' "$EMAIL" "$PASSWORD" >> "$ENV_FILE"
echo "Added the login to $ENV_FILE. Add these as GitHub secrets:"
printf 'E2E_MEMBER_EMAIL=%s\nE2E_MEMBER_PASSWORD=%s\n' "$EMAIL" "$PASSWORD"
