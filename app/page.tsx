'use client'
import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import Link from 'next/link'
import ResumeUpload from '@/components/ResumeUpload' // 路径根据你项目实际位置调整
// Initialize Stripe outside of component to avoid recreating it on each render
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

export default function Home() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [showUploader, setShowUploader] = useState(false);

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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to MentorUp
          </h1>
          <p className="text-lg text-gray-600">
            Explore our features and get started
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Authentication Cards */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication</h2>
              <div className="space-y-3">
                <Link 
                  href="/login"
                  className="block w-full text-center px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition-colors"
                >
                  Login
                </Link>
                <Link 
                  href="/register"
                  className="block w-full text-center px-4 py-2 border border-green-500 text-green-500 rounded-md hover:bg-green-50 transition-colors"
                >
                  Register
                </Link>
                <Link 
                  href="/search"
                  className="block w-full text-center px-4 py-2 border border-green-500 text-green-500 rounded-md hover:bg-green-50 transition-colors"
                >
                  Search Page
                </Link>
                <Link 
                  href="/signup-process/mentor/123"
                  className="block w-full text-center px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition-colors mt-4"
                >
                  Mentor Signup
                </Link>
                
                <Link 
                  href="/signup-process/mentee"
                  className="block w-full text-center px-4 py-2 border border-purple-500 text-purple-500 rounded-md hover:bg-purple-50 transition-colors mt-4"
                >
                  Mentee Signup
                </Link>
                <Link 
                  href="/mentor-profile/165eb4b0-cb9f-4465-bd60-bd3dfc2e5f61"
                  className="block w-full text-center px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 transition-colors mt-4"
                >
                  Mentor Profile Page
                </Link>
                <Link 
                  href="/signup-process/roleselect/165eb4b0-cb9f-4465-bd60-bd3dfc2e5f61"
                  className="block w-full text-center px-4 py-2 border border-purple-500 text-purple-500 rounded-md hover:bg-purple-50 transition-colors mt-4"
                >
                  Role Select Page
                </Link>
                <Link
                    href="/mentor2/165eb4b0-cb9f-4465-bd60-bd3dfc2e5f61"
                    className="block w-full text-center px-4 py-2 border border-purple-500 text-purple-500 rounded-md hover:bg-purple-50 transition-colors mt-4"
                >
                  Mentor Schedule Page
                </Link>
              </div>
            </div>
          </div>

          {/* Features Cards */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
              <div className="space-y-3">
                <Link 
                  href="/booking/calendar"
                  className="block w-full text-center px-4 py-2 border border-purple-500 text-purple-500 rounded-md hover:bg-purple-50 transition-colors"
                >
                  Booking Calendar
                </Link>
                <Link 
                  href="/checkout/cancel"
                  className="block w-full text-center px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50 transition-colors"
                >
                  Checkout Cancel
                </Link>
                <Link
                    href="/resume"
                    className="block w-full text-center px-4 py-2 border border-indigo-500 text-indigo-500 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  Upload Resume
                </Link>
                <Link
                    href="/booking/payment"
                    className="block w-full text-center px-4 py-2 border border-orange-500 text-orange-500 rounded-md hover:bg-orange-50 transition-colors"
                >
                  Payment page
                </Link>
                <Link
                    href="/schedule"
                    className="block w-full text-center px-4 py-2 border border-indigo-500 text-indigo-500 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  Scheduling page
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Getting Started</h3>
          <p className="text-gray-600">
            Create an account or log in to access all features
          </p>
        </div>

      </main>
    </div>
  )
}
