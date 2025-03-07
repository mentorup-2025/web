'use client'
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'

// Initialize Stripe outside of component to avoid recreating it on each render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export default function Home() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseInt(amount) * 100, // Convert to cents
          currency: 'usd',
        }),
      })

      const { sessionId } = await response.json()

      // Get Stripe.js instance
      const stripe = await stripePromise

      // Redirect to Stripe Checkout
      const { error } = await stripe!.redirectToCheckout({
        sessionId,
      })

      if (error) {
        console.error('Stripe error:', error)
        alert(error.message)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Link href="/login" legacyBehavior>
        <a className="absolute top-4 right-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-700 transition duration-200">
          Login
        </a>
      </Link>
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-blue-900 mb-4">
            Welcome to MentorUp
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with expert mentors and accelerate your professional growth
          </p>
        </div>

        {/* Payment Form */}
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Book a Mentoring Session
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="amount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Amount (USD)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="amount"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !amount}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${
                    loading || !amount
                      ? 'bg-blue-300 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
