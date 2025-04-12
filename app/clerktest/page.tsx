'use client'

import { SignIn, SignUp, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function ClerkTestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <SignedOut>
        <div className="flex flex-col gap-4 items-center">
          <h1 className="text-2xl font-bold mb-4">Test Clerk Auth</h1>
          <SignIn />
          <span className="text-gray-500">or</span>
          <SignUp />
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex flex-col gap-4 items-center">
          <h1 className="text-2xl font-bold">Welcome Back!</h1>
          <UserButton afterSignOutUrl="/clerktest" />
        </div>
      </SignedIn>
    </main>
  )
} 