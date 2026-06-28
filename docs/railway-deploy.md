# Railway Deployment

This app can run on Railway as a standalone Next.js service.

## Current Data Architecture

Sarathy currently uses Supabase for both authentication and application data. Deploying the app to Railway does not automatically move auth or tables to Railway Postgres.

Use this setup for the first Railway deployment:

- Railway hosts the Next.js app.
- Supabase remains the live auth and database backend.
- Railway Postgres may be attached for future server-side features, but it is not used by the current code until a deliberate migration or hybrid data layer is added.

## Required Railway Variables

Set these on the Next.js service:

```text
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GROQ_API_KEY=...
```

If you attach Railway Postgres, also set:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

`DATABASE_URL` should be added as a Railway reference variable from the Postgres service so it stays in sync when database credentials rotate.

## Deploy Steps

1. Create a new Railway project.
2. Deploy from the GitHub repository `aGamingGod1234/sarathyv2`.
3. Add the required environment variables above.
4. Generate a public Railway domain from the service networking settings.
5. Optional: add a PostgreSQL database service and reference its `DATABASE_URL` in the app service.

## Notes Before Moving Off Supabase

A full Railway Postgres migration is a separate project because the app currently depends on Supabase Auth, browser Supabase clients, row-level access patterns, and many direct table calls. A real migration needs:

- Auth replacement or a decision to keep Supabase Auth.
- Schema migrations for every table currently read through Supabase.
- Server-side data access routes or an ORM.
- Row-level authorization rules implemented outside Supabase.
- Billing tables for paid plan status after Stripe or another provider is added.

