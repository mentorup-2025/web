import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs'
import '@/styles/globals.css'

function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  return (
    <ClerkProvider>
      <SignedOut>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
      <Component {...pageProps} />
    </ClerkProvider>
  )
}
