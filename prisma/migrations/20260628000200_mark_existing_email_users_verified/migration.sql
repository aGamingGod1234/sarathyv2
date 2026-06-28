UPDATE "User"
SET "emailVerified" = CURRENT_TIMESTAMP
WHERE "email" IS NOT NULL
  AND "emailVerified" IS NULL;
