export function isAuthConfigured() {
  return Boolean(
    process.env.DATABASE_URL &&
    (process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET),
  )
}
