import { authMiddleware } from '@clerk/nextjs'

export default authMiddleware({
  publicRoutes: ['/marketing', '/sign-in(.*)', '/sign-up(.*)'],
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/api/(.*)'],
}
