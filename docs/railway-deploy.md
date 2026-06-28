# Railway Deployment

This app can run on Railway as a standalone Next.js service.

## Current Data Architecture

Sarathy now uses Railway Postgres through Prisma for application data and Auth.js/NextAuth for authentication.

The runtime no longer depends on Supabase. The former Supabase-shaped client in `lib/supabase.ts` is now a compatibility layer that calls app-owned API routes backed by Prisma.

Railway should host:

- The Next.js app service.
- A PostgreSQL service.
- A `DATABASE_URL` reference variable from PostgreSQL to the app service.

## Required Railway Variables

Set these on the Next.js service:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXTAUTH_SECRET=generate-a-long-random-secret
NEXTAUTH_URL=https://your-railway-domain
GROQ_API_KEY=...
DEEPSEEK_API_KEY=...
```

`GROQ_API_KEY` powers receipt image scanning and is the first-choice AI provider. `DEEPSEEK_API_KEY` is the silent fallback for text-only statement categorization and uses `deepseek-v4-flash` with thinking disabled. If you want to override the model later, set:

```text
DEEPSEEK_MODEL=deepseek-v4-flash
```

Google sign-in is intentionally paused. To turn it back on later, set all three values:

```text
GOOGLE_AUTH_ENABLED=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Google OAuth callback URL:

```text
https://your-railway-domain/api/auth/callback/google
```

## Deploy Steps

1. Create a new Railway project.
2. Deploy from the GitHub repository `aGamingGod1234/sarathyv2`.
3. Add a PostgreSQL database service.
4. Add `DATABASE_URL` to the app service as a reference variable from the PostgreSQL service.
5. Add the required Auth/Groq/Google variables above.
6. Generate a public Railway domain from the service networking settings.
7. Redeploy the app service.

The app uses `railway.json` to run:

```text
npm run db:migrate
```

before deployment. That applies the Prisma migrations in `prisma/migrations`.

## Supabase Data Import Notes

The app schema and runtime are migrated off Supabase. Existing Supabase production data still requires a one-time import if there are real users/data to preserve.

Important auth limitation: Supabase does not expose reusable plaintext passwords. If existing users signed in with email/password, they will need to create a new password or use Google after migration. App data can be imported if you provide a Supabase service-role export or database dump.

Recommended import path:

- Export Supabase `profiles`, `budget_entries`, `fixed_spending`, `mood_logs`, `goals`, `chat_messages`, `remittance_logs`, `circles`, `circle_members`, and `circle_moments`.
- Insert users into Auth.js `User` rows using their Supabase auth IDs where possible.
- Insert app rows into the matching Railway Postgres tables.
- Ask email/password users to reset/create a new password in the new system.
