# Vercel deployment

Import `aGamingGod1234/sarathyv2` into Vercel with the Next.js framework preset and repository root as the project directory.

- Node.js: 24.x
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: Next.js default

Vercel runs the Next.js routes as functions. The standalone start command is for Railway and local self-hosting.

## Required services

Configure these as Vercel environment variables for each deployment environment:

- `DATABASE_URL`: an externally reachable PostgreSQL connection string. A Railway private network hostname cannot be reached from Vercel. Use the database provider's pooler when available.
- `NEXTAUTH_SECRET`: a long random signing secret.
- `NEXTAUTH_URL`: the final public app URL without a trailing slash.
- `RESEND_API_KEY` and `OTP_EMAIL_FROM`: required for email verification and password reset, using a verified sender domain.
- `OPENAI_API_KEY`: required for AI features.

Apply the existing Prisma migrations against the intended database with `npm run db:migrate` before enabling account access. Vercel does not run the `railway.json` pre-deploy command. Keep production database migrations separate from preview builds.

Without both a database URL and an authentication secret, the public landing page remains available. Sign-in, registration, and password-reset pages explain that account services are unavailable, and the Auth.js endpoint returns HTTP 503. This mode does not provide sample accounts or substitute data. Adding credentials restores the normal account flow; database connectivity and email delivery must still be verified.

## GitHub integration

Connect the project to this repository in Vercel's Git settings to enable automatic deployments. A file upload through the connected Vercel tool does not establish that connection. If the initial upload used a source-download install command, replace it with `npm ci` after connecting GitHub.

Verify the public landing page, hero video assets, account availability state, and authenticated features after deployment. An HTTP 200 from the landing page alone does not verify database, email, or AI services.
