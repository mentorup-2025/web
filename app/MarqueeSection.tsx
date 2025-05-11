import React from 'react'

const MarqueeSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 text-center py-4 bg-white z-10">
        <p className="text-lg font-semibold text-gray-900">
          Trusted by 100+ mentors from top organizations.
        </p>
      </div>

      <div className="overflow-x-auto whitespace-nowrap py-4">
        <div className="flex animate-marquee">
          <img src="/public/intuit" alt="intuit" className="mx-6 h-12" />
          <img src="/path-to-logo2.png" alt="Company 2" className="mx-6 h-12" />
          <img src="/path-to-logo3.png" alt="Company 3" className="mx-6 h-12" />
          <img src="/path-to-logo4.png" alt="Company 4" className="mx-6 h-12" />
          <img src="/path-to-logo5.png" alt="Company 5" className="mx-6 h-12" />
          <img src="/path-to-logo6.png" alt="Company 6" className="mx-6 h-12" />
          <img src="/path-to-logo1.png" alt="Company 1" className="mx-6 h-12" />
          <img src="/path-to-logo2.png" alt="Company 2" className="mx-6 h-12" />
          <img src="/path-to-logo3.png" alt="Company 3" className="mx-6 h-12" />
          <img src="/path-to-logo4.png" alt="Company 4" className="mx-6 h-12" />
          <img src="/path-to-logo5.png" alt="Company 5" className="mx-6 h-12" />
          <img src="/path-to-logo6.png" alt="Company 6" className="mx-6 h-12" />
        </div>
      </div>
    </section>
  )
}

export default MarqueeSection
