import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/(.*)',
  '/login(.*)', 
  '/signup(.*)', 
  '/signup(.*)',
  '/api/availability/get(.*)',
  '/mentor-list(.*)',
  '/api/clerk_webhooks/(.*)',
])

// Export a dummy middleware when auth is disabled
const dummyMiddleware = () => {};

// Use environment variable to toggle auth
export default process.env.ENABLE_AUTH === 'true' 
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth.protect()
      }
    })
  : dummyMiddleware;

export const config = {
  signUpUrl: "/signup",
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}; 