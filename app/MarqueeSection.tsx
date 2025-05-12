'use client';

import React, { useRef, useState, useEffect } from 'react';

const MarqueeSection = () => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    if (sliderRef.current) {
      setStartX(e.pageX - sliderRef.current.offsetLeft);
      setScrollLeft(sliderRef.current.scrollLeft);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    if (sliderRef.current) {
      const x = e.pageX - sliderRef.current.offsetLeft;
      const walk = (x - startX) * 2; // Scroll speed multiplier
      sliderRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <section className="relative overflow-hidden bg-white py-8">
      <div className="absolute top-0 left-0 right-0 text-center py-4 bg-white z-10">
        <p className="text-lg font-semibold text-gray-900">
          Trusted by 100+ mentors from top organizations.
        </p>
      </div>

      <div 
        ref={sliderRef}
        className="flex overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          scrollBehavior: isDragging ? 'auto' : 'smooth',
          WebkitOverflowScrolling: 'touch',
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
          height: '200px'
        }}
      >
        <div className="flex items-center space-x-12 px-4">
          <img src="/images/Google_2015_logo.svg 1_brandlogo.png" alt="Google" className="h-12 w-auto object-contain" />
          <img src="/images/Microsoft-Logo 1_brandlogo.png" alt="Microsoft" className="h-12 w-auto object-contain" />
          <img src="/images/Amazon-Logo 1_brandlogo.png" alt="Amazon" className="h-12 w-auto object-contain" />
          <img src="/images/Meta_Platforms_Inc._logo 1_brandlogo.png" alt="Meta" className="h-12 w-auto object-contain" />
          <img src="/images/LinkedIn-Logo.wine 1_brandlogo.png" alt="LinkedIn" className="h-12 w-auto object-contain" />
          <img src="/images/Intuit_Logo.svg 1_brandlogo.png" alt="Intuit" className="h-12 w-auto object-contain" />
          <img src="/images/Citadel_LLC_Logo.svg 1_brandlogo.png" alt="Citadel" className="h-12 w-auto object-contain" />
          <img src="/images/McKinsey_&_Company-Logo.wine 1_brandlogo.png" alt="McKinsey" className="h-12 w-auto object-contain" />
          <img src="/images/TikTok_logo.svg 2_brandlogo.png" alt="TikTok" className="h-12 w-auto object-contain" />
          <img src="/images/Vector_brandlogo.png" alt="Vector" className="h-12 w-auto object-contain" />
        </div>
      </div>

      {/* Gradient overlays for smooth edges */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent pointer-events-none" />
    </section>
  );
};

export default MarqueeSection;
