# Sarathy

Sarathy is a Next.js finance tracking app with Auth.js/NextAuth authentication, Prisma, Railway Postgres, email OTP verification, password reset codes, and OpenAI-powered finance assistance.

This repo is ready for a fresh Railway deployment. You do not need Supabase for the current app runtime.

## Tech Stack

- Next.js app router
- React 18
- Prisma ORM
- PostgreSQL
- Auth.js / NextAuth
- Resend for email OTPs
- OpenAI Responses API for Sarathy chat, receipt scanning, statement parsing, and product price lookup
- Railway for hosting and Postgres

## Required Accounts

You need these accounts before deployment:

- GitHub account with access to this repository
- Railway account
- OpenAI account with an API key
- Resend account with an API key
- Domain/DNS provider access if you want production email sending and a custom app domain
- Google Cloud account only if you want Google sign-in
- Stripe account only if you are adding paid billing/checkout

## Required Environment Variables

Set these variables on the Railway app service, not inside the repo.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string used by Prisma. On Railway, set this as a reference to the Railway Postgres service. |
| `NEXTAUTH_SECRET` | Yes | Auth.js signing/encryption secret for sessions and OTP hashing. Use a long random value. |
| `NEXTAUTH_URL` | Yes | Public app URL, for example `https://your-app.up.railway.app` or `https://app.yourdomain.com`. No trailing slash. |
| `OPENAI_API_KEY` | Yes for AI features | OpenAI API key used by chat, receipt scanning, statement parsing, and product price lookup. |
| `RESEND_API_KEY` | Yes for email sign-up/reset | Resend API key used to send email verification and password reset OTPs. |
| `OTP_EMAIL_FROM` | Yes for email sign-up/reset | Sender identity, for example `Sarathy <verify@yourdomain.com>`. Must use a Resend-verified domain in production. |
| `OPENAI_MODEL` | Optional | Defaults to `gpt-5.5`. |
| `OPENAI_REASONING_EFFORT` | Optional | Defaults to `low`. |
| `OPENAI_TEXT_VERBOSITY` | Optional | Defaults to `low`. |
| `GOOGLE_AUTH_ENABLED` | Optional | Set to `true` only after Google OAuth is configured. Defaults to disabled. |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID. Required only if Google sign-in is enabled. |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret. Required only if Google sign-in is enabled. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Optional/future | Stripe publishable key. The current runtime does not read it until Stripe UI/client code is added. |
| `STRIPE_SECRET_KEY` | Optional/future | Stripe secret key. The current runtime does not read it until checkout/server billing code is added. |
| `STRIPE_WEBHOOK_SECRET` | Optional/future | Stripe webhook signing secret. The current runtime does not read it until a webhook route is added. |
| `STRIPE_PLUS_PRICE_ID` | Optional/future | Stripe recurring price ID for the Plus plan. The current runtime does not read it until checkout code is added. |

Use `AUTH_SECRET` only as a fallback if your platform already uses that name. Prefer `NEXTAUTH_SECRET`.

## Generate Secrets

Generate `NEXTAUTH_SECRET` locally:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Copy the printed value into Railway as `NEXTAUTH_SECRET`.

Do not commit `.env`, `.env.local`, API keys, database URLs, OAuth secrets, or Resend secrets. `.env` and `.env.local` are intentionally ignored by Git.

## Fresh Railway Deployment

1. Push this repository to GitHub.
2. Open Railway and create a new project.
3. Choose `Deploy from GitHub repo`.
4. Select this repository.
5. Add a PostgreSQL database service in the same Railway project.
6. Open the app service variables.
7. Add `DATABASE_URL` as a Railway reference variable from the Postgres service. If the database service is named `Postgres`, it usually looks like:

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

If your Railway database service has a different name, use Railway's variable reference picker and select that service's `DATABASE_URL`.

8. Add the required app variables:

```text
NEXTAUTH_SECRET=your-generated-secret
NEXTAUTH_URL=https://your-public-railway-domain
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
OTP_EMAIL_FROM=Sarathy <verify@your-verified-domain.com>
OPENAI_MODEL=gpt-5.5
OPENAI_REASONING_EFFORT=low
OPENAI_TEXT_VERBOSITY=low
GOOGLE_AUTH_ENABLED=false
```

If Google OAuth is enabled, also add:

```text
GOOGLE_AUTH_ENABLED=true
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

If Stripe billing code is added later, also add:

```text
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_SECRET_KEY=sk_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

9. Generate a public Railway domain for the app service in Railway networking settings.
10. Set `NEXTAUTH_URL` to that exact URL.
11. Redeploy the app service.

The repo includes `railway.json`. Railway uses it to:

- Build with Nixpacks.
- Run `npm run db:migrate` before each deploy.
- Start the standalone Next.js server with `npm run start`.

## Database Setup

The app uses the PostgreSQL database pointed to by `DATABASE_URL`.

Prisma migrations live in `prisma/migrations`. On Railway, migrations are applied automatically before deploy because `railway.json` contains:

```json
"preDeployCommand": "npm run db:migrate"
```

If you need to run migrations manually with Railway's environment variables:

```bash
railway run npm run db:migrate
```

If you run migrations locally, make sure your local shell has the production `DATABASE_URL` only when you intentionally want to migrate production.

After migrations, the database will contain app tables such as:

- `User`, `Account`, `Session`, `VerificationToken`
- `profiles`
- `budget_entries`
- `fixed_spending`
- `goals`
- `mood_logs`
- `chat_messages`
- `remittance_logs`
- `waitlist`
- `circles`
- `circle_members`
- `circle_moments`
- `ai_daily_usage`
- `ai_usage_events`
- `security_attempts`
- `pending_credential_changes`

The `security_attempts` and `pending_credential_changes` tables are required for OTP throttling, sign-in lockout, invite-code throttling, and safe unverified signup handling.

## Resend Email Setup

Email verification and password reset require Resend.

1. Create a Resend account.
2. Create an API key.
3. Add the API key to Railway as `RESEND_API_KEY`.
4. In Resend, add and verify a sending domain that you control.
5. Resend will show DNS records for the domain. Add every record it shows at your DNS provider.
6. Wait until Resend marks the domain as verified.
7. Create or choose a sender address on that verified domain, for example `verify@yourdomain.com`.
8. Set Railway variable:

```text
OTP_EMAIL_FROM=Sarathy <verify@yourdomain.com>
```

Do not use `onboarding@resend.dev` for public production sign-ups. Resend restricts that test sender, and the app will reject it for public OTP delivery.

Test email after deploy:

1. Visit `/app/signup`.
2. Create an account with an email you can receive.
3. Confirm that the 6 digit OTP arrives.
4. Verify the account.
5. Test `/app/forgot-password` as well.

## OpenAI Setup

OpenAI powers:

- Sarathy chat
- Receipt image scanning
- Statement transaction categorization
- Product price lookup with web search when needed

Setup:

1. Create an OpenAI API key.
2. Add it to Railway:

```text
OPENAI_API_KEY=sk-...
```

Optional model settings:

```text
OPENAI_MODEL=gpt-5.5
OPENAI_REASONING_EFFORT=low
OPENAI_TEXT_VERBOSITY=low
```

If `OPENAI_API_KEY` is missing, the app still runs, but AI endpoints return configuration errors.

## Google OAuth Setup

Google sign-in is disabled by default. Email/password sign-up works without it.

To enable Google sign-in:

1. Open Google Cloud Console.
2. Create or select a project for Sarathy.
3. Go to `APIs & Services` -> `OAuth consent screen`.
4. Choose the user type that matches the deployment:
   - Use `External` for public users.
   - Use `Internal` only if the app is restricted to one Google Workspace organization.
5. Fill in the app name, support email, developer contact email, and app domain fields.
6. Add the production domain to authorized domains, for example `yourdomain.com`. For a Railway generated URL, use the Railway domain shown in the Railway service settings.
7. Save the consent screen.
8. Go to `APIs & Services` -> `Credentials`.
9. Click `Create Credentials` -> `OAuth client ID`.
10. Choose `Web application`.
11. Add authorized JavaScript origins:

```text
https://your-app-domain
```

Examples:

```text
https://your-app.up.railway.app
https://app.yourdomain.com
```

12. Add this authorized redirect URI:

```text
https://your-app-domain/api/auth/callback/google
```

Examples:

```text
https://your-app.up.railway.app/api/auth/callback/google
https://app.yourdomain.com/api/auth/callback/google
```

13. Create the OAuth client.
14. Copy the client ID and client secret into Railway:

```text
GOOGLE_AUTH_ENABLED=true
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

15. Redeploy the Railway app service.
16. Test by opening `/app/login` and using Google sign-in.

If you later change domains, update both `NEXTAUTH_URL` in Railway and the Google OAuth redirect URI.

## Stripe Billing Setup

Stripe billing is optional and is not required for the current app to deploy or run.

Important current-state note: this repository currently has pricing/Plus UI copy, but it does not include Stripe Checkout routes, Stripe webhook routes, or the `stripe` npm package. The server blocks direct `plan_tier` edits from the generic DB route, and the Plus page states that paid features should be unlocked only after server-verified billing is connected. That means Stripe credentials alone will not enable paid subscriptions until billing code is added.

If you are adding Stripe billing, use this setup:

1. Create a Stripe account.
2. Finish business/profile setup in Stripe.
3. Start in Stripe test mode.
4. Go to `Developers` -> `API keys`.
5. Copy the publishable key and secret key.
6. Add these Railway variables:

```text
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

7. Go to `Product catalog`.
8. Create a product named `Sarathy Plus`.
9. Create a recurring price for the product, for example monthly billing.
10. Copy the price ID. It starts with `price_`.
11. Add it to Railway:

```text
STRIPE_PLUS_PRICE_ID=price_...
```

12. When checkout code is added, use `STRIPE_PLUS_PRICE_ID` server-side to create Checkout Sessions. Do not trust client-supplied price IDs.
13. When webhook code is added, create a Stripe webhook endpoint for the app's production URL. A common endpoint path is:

```text
https://your-app-domain/api/stripe/webhook
```

Only use that exact URL if the repo has a matching route. At the moment, this repo does not.

14. Select at least these Stripe webhook events when billing code exists:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_failed
```

15. Copy the webhook signing secret. It starts with `whsec_`.
16. Add it to Railway:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

17. Redeploy after adding billing code and variables.
18. Test with Stripe test cards before switching to live mode.

When moving to live mode, replace all test keys and test price IDs with live values:

```text
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PLUS_PRICE_ID=price_live_or_live_price_id
STRIPE_WEBHOOK_SECRET=whsec_...
```

Never expose `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` in frontend code. Only the publishable key can be public.

## Custom Domain Setup

You can use Railway's generated domain or a custom domain.

For a Railway-generated domain:

1. Open the Railway app service.
2. Go to networking/domain settings.
3. Generate a public domain.
4. Copy the full `https://...` URL.
5. Set `NEXTAUTH_URL` to that URL.
6. Redeploy.

For a custom domain:

1. Add the custom domain in the Railway app service networking settings.
2. Railway will show DNS records to add.
3. Add those records at your DNS provider.
4. Wait for Railway to show the domain as active.
5. Set `NEXTAUTH_URL=https://your-custom-domain`.
6. If Google sign-in is enabled, add `https://your-custom-domain/api/auth/callback/google` to Google OAuth.
7. If Stripe billing is added, update Stripe webhook endpoints and customer portal return URLs to the custom domain.
8. Redeploy.

Use the same final domain in any client-facing links.

## Local Development

Requirements:

- Node.js 20
- npm 10
- PostgreSQL, either local or Railway

Setup:

```bash
npm install
cp .env.example .env.local
npm run db:generate
npm run dev
```

Edit `.env.local` with your own local values.

For local Postgres, create a database named `sarathy` and use a local URL like:

```text
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sarathy?schema=public"
```

Apply migrations locally:

```bash
npm run db:migrate
```

Open:

```text
http://localhost:3000
```

## Useful Commands

```bash
npm run dev
npm run build
npm run start
npm run db:generate
npm run db:migrate
npm run test:security
```

## Deployment Verification Checklist

After deploying on Railway:

1. Open the public app URL.
2. Confirm the landing page loads.
3. Create a new account at `/app/signup`.
4. Confirm the OTP email arrives.
5. Verify the email.
6. Sign in.
7. Complete onboarding.
8. Add a budget entry.
9. Create and join a circle with an invite code.
10. Test Sarathy chat.
11. Test receipt scan or statement import if OpenAI is configured.
12. Test forgot-password OTP.
13. If Google OAuth is enabled, test Google sign-in and sign-out.
14. If Stripe billing code has been added, test Stripe Checkout and webhook delivery in Stripe test mode.

## Security Notes

- Never commit `.env` or `.env.local`.
- Do not paste real API keys into issues, pull requests, screenshots, or README files.
- Rotate `NEXTAUTH_SECRET`, `OPENAI_API_KEY`, `RESEND_API_KEY`, Google OAuth secrets, and Stripe secret keys if they are ever exposed.
- Use a verified Resend domain for production email.
- Keep `DATABASE_URL` private.
- Railway variables should be configured on the app service, not hardcoded in source.

## Troubleshooting

### `DATABASE_URL` is missing

Add a Railway Postgres service and set `DATABASE_URL` on the app service as a reference to the Postgres service.

### Prisma migration fails during deploy

Check the Railway deploy logs for the exact Prisma error. Common causes are:

- `DATABASE_URL` is missing or points to the wrong database.
- The Postgres service is still starting.
- The app service does not have access to the referenced Postgres variable.

Run manually if needed:

```bash
railway run npm run db:migrate
```

### Sign-in redirects or callbacks fail

Check:

- `NEXTAUTH_URL` matches the exact public domain.
- `NEXTAUTH_SECRET` is set and stable.
- If Google is enabled, the Google OAuth redirect URI exactly matches the current domain.

### Google sign-in button does not work

Check:

- `GOOGLE_AUTH_ENABLED=true` is set.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set on Railway.
- The Google OAuth client is type `Web application`.
- The authorized redirect URI is exactly `https://your-domain/api/auth/callback/google`.
- The authorized JavaScript origin is exactly `https://your-domain`.
- Railway was redeployed after changing variables.

### Email OTP does not send

Check:

- `RESEND_API_KEY` is set.
- `OTP_EMAIL_FROM` uses a sender on a verified Resend domain.
- DNS records in Resend are verified.
- Railway deploy logs for `OTP_...` error codes.

### Sarathy AI says it is not configured

Set `OPENAI_API_KEY` on the Railway app service and redeploy.

### Stripe is configured but Plus is not unlocking

This is expected unless Stripe checkout and webhook code has been added. The current repo does not include Stripe runtime integration. Add server-side checkout creation and webhook handling before relying on Stripe for `plan_tier` changes.

When billing code exists, check:

- `STRIPE_SECRET_KEY` is set.
- `STRIPE_PLUS_PRICE_ID` points to the intended recurring price.
- `STRIPE_WEBHOOK_SECRET` matches the exact webhook endpoint.
- Webhook events are successfully delivered in the Stripe dashboard.
- The webhook handler updates the user's plan only after verifying the Stripe signature.

### Build succeeds locally but not on Railway

Check that Railway is using Node 20 and npm 10 as declared in `package.json`.

## Existing Data Migration

For a fresh client deployment, no data import is needed.

If moving from an old Supabase instance, export old app data and import it into Railway Postgres. Supabase plaintext passwords cannot be exported, so email/password users should reset or recreate passwords in the new app.
