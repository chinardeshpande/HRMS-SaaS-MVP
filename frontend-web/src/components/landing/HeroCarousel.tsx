import { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface CarouselSlide {
  image: string;
  title: string;
  description: string;
}

const slides: CarouselSlide[] = [
  {
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.07.33-AM.png',
    title: 'Modern Dashboard',
    description: 'Get instant insights into your workforce with our intuitive dashboard',
  },
  {
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.15.14-AM.png',
    title: 'Employee Management',
    description: 'Comprehensive employee profiles and lifecycle management',
  },
  {
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.16.18-AM.png',
    title: 'Performance Tracking',
    description: 'Monitor and improve employee performance with data-driven insights',
  },
  {
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.18.08-AM.png',
    title: 'Onboarding Excellence',
    description: 'Streamline new hire onboarding with automated workflows',
  },
  {
    image: '/images/Product-Screenshots/Screenshot-2026-03-26-at-10.19.47-AM.png',
    title: 'Leave Management',
    description: 'Smart leave policies with automated approvals and tracking',
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
