import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/marketing(.*)', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) return
  await auth.protect()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/api/(.*)'],
}
