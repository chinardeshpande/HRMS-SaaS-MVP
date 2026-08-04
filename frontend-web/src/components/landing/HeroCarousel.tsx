import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CarouselSlide {
  image: string;
  title: string;
  description: string;
}

const slides: CarouselSlide[] = [
  {
    image: '/images/Hero-Images/aura-people-team-v2.jpg',
    title: 'Empower Your Team',
    description: 'Build a connected, engaged workforce with modern HR tools',
  },
  {
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.33-AM.png',
    title: 'Real-Time Insights',
    description: 'Make data-driven decisions with comprehensive analytics dashboard',
  },
  {
    image: '/images/Hero-Images/aura-employee-welcome-v2.jpg',
    title: 'Seamless Onboarding',
    description: 'Create memorable first impressions for every new hire',
  },
  {
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.15.14-AM.png',
    title: 'Complete Employee Profiles',
    description: 'Centralized employee data with full lifecycle management',
  },
  {
    image: '/images/Hero-Images/aura-leadership-team-v2.jpg',
    title: 'Culture & Engagement',
    description: 'Foster a positive workplace culture that retains top talent',
  },
  {
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.19.47-AM.png',
    title: 'Smart Automation',
    description: 'Automate leave management, approvals, and repetitive tasks',
  },
];

export default function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
  };

  return (
    <div className="relative w-full h-full">
      {/* Slides */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl h-full">
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover object-top"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Slide Info */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">{slide.title}</h3>
              <p className="text-gray-200">{slide.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white p-3 rounded-full transition-all"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all ${
              index === currentSlide
                ? 'w-8 bg-white'
                : 'w-2 bg-white/50 hover:bg-white/75'
            } h-2 rounded-full`}
          />
        ))}
      </div>
    </div>
  );
}
