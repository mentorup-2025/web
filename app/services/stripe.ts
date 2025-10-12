import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe once and export the promise
// This ensures we only load Stripe once across the entire app
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
