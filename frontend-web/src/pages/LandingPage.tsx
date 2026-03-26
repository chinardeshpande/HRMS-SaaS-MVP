import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  BoltIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronUpIcon,
  DocumentChartBarIcon,
  UserGroupIcon,
  BriefcaseIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import HeroCarousel from '../components/landing/HeroCarousel';
import { modules } from '../data/modulesData';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId.replace('#', ''));
    if (element) {
      const offset = 80; // Account for fixed navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    setMobileMenuOpen(false);
  };

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };


  const benefits = [
    {
      title: 'Save Time',
      description: 'Automate repetitive HR tasks and reduce manual data entry by 70%',
      metric: '70%',
      label: 'Time Saved',
    },
    {
      title: 'Improve Accuracy',
      description: 'Eliminate errors with automated workflows and data validation',
      metric: '99.9%',
      label: 'Accuracy',
    },
    {
      title: 'Boost Engagement',
      description: 'Empower employees with self-service portals and transparent processes',
      metric: '4.8/5',
      label: 'Satisfaction',
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$49',
      period: '/month',
      description: 'Perfect for small teams getting started',
      features: [
        'Up to 50 employees',
        'Employee management',
        'Attendance tracking',
        'Basic reports',
        'Email support',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: '$99',
      period: '/month',
      description: 'Ideal for growing organizations',
      features: [
        'Up to 200 employees',
        'All Starter features',
        'Performance reviews',
        'Onboarding workflows',
        'Advanced analytics',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'Tailored for large enterprises',
      features: [
        'Unlimited employees',
        'All Professional features',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        '24/7 phone support',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'HR Director',
      company: 'TechCorp Inc.',
      image: null,
      quote: 'AuroraHR transformed our HR operations. We reduced onboarding time by 60% and employee satisfaction has never been higher.',
      rating: 5,
    },
    {
      name: 'Michael Chen',
      role: 'CEO',
      company: 'InnovateLabs',
      image: null,
      quote: 'The analytics and reporting features give us invaluable insights into our workforce. Best investment we made this year.',
      rating: 5,
    },
    {
      name: 'Emily Rodriguez',
      role: 'Operations Manager',
      company: 'GlobalSolutions',
      image: null,
      quote: 'Incredible platform with exceptional support. The automation features saved us countless hours every week.',
      rating: 5,
    },
  ];

  const stats = [
    { value: '500+', label: 'Companies Trust Us' },
    { value: '50K+', label: 'Employees Managed' },
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Support Available' },
  ];

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img
                src="/images/AuroraHR_logo.svg"
                alt="AuroraHR"
                className="h-12 w-auto cursor-pointer"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('features')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Testimonials
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-ghost text-primary-600"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/login')}
                className="btn btn-primary"
              >
                Start Free Trial
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" />
                ) : (
                  <Bars3Icon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection('features')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left"
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left"
                >
                  Pricing
                </button>
                <button
                  onClick={() => scrollToSection('testimonials')}
                  className="text-gray-600 hover:text-gray-900 transition-colors text-left"
                >
                  Testimonials
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-ghost text-primary-600 w-full"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary w-full"
                >
                  Start Free Trial
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-primary-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Hero Content */}
            <div>
              <div className="inline-flex items-center space-x-2 bg-primary-100 text-primary-700 rounded-full px-4 py-2 mb-6">
                <SparklesIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Modern HR Platform</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Transform Your
                <span className="block bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                  HR Operations
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Streamline employee management, automate workflows, and empower your workforce
                with AuroraHR - the all-in-one HRMS platform trusted by 500+ companies.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => navigate('/login')}
                  className="btn btn-primary btn-lg group"
                >
                  Start Free Trial
                  <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="btn btn-outline btn-lg">
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index}>
                    <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Carousel */}
            <div className="relative animate-slide-in-right h-[600px]">
              <HeroCarousel />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose AuroraHR?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for modern HR teams who want to focus on people, not paperwork
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-shadow"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
                  {benefit.metric}
                </div>
                <div className="text-sm text-gray-500 mb-4">{benefit.label}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Your Workforce
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive HR features designed to scale with your business
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {modules.map((module) => {
              const IconComponent = module.icon;
              return (
                <div
                  key={module.id}
                  onClick={() => navigate(`/features/${module.id}`)}
                  className="bg-white rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-2 cursor-pointer group"
                >
                  <div className={`bg-gradient-to-br ${module.gradient} rounded-xl p-3 w-fit mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{module.description}</p>
                  <div className="flex items-center text-primary-600 font-medium group-hover:translate-x-2 transition-transform">
                    Learn more
                    <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Get Started in Minutes</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple setup process with guided onboarding
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create Account',
                description: 'Sign up and set up your company profile in under 5 minutes',
                icon: UserGroupIcon,
              },
              {
                step: '02',
                title: 'Import Data',
                description: 'Easily import employee data from spreadsheets or your existing system',
                icon: DocumentChartBarIcon,
              },
              {
                step: '03',
                title: 'Start Managing',
                description: 'Begin automating HR workflows and empowering your team',
                icon: BoltIcon,
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white text-2xl font-bold mb-6">
                    {step.step}
                  </div>
                  <div className="bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl p-3 w-fit mx-auto mb-6">
                    <step.icon className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-primary-300 to-transparent"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your team size and needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-8 ${
                  plan.highlighted
                    ? 'ring-2 ring-primary-600 shadow-2xl scale-105'
                    : 'border border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-primary-600 text-white text-sm font-semibold text-center py-2 px-4 rounded-lg mb-6">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircleIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
                      <span className="ml-3 text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/login')}
                  className={`btn w-full ${
                    plan.highlighted ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">
              All plans include 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Loved by HR Teams Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what our customers have to say about AuroraHR
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-2xl p-8 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center space-x-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your HR Operations?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join 500+ companies already using AuroraHR to streamline their workforce management
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg group"
            >
              Start Free Trial
              <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 btn-lg">
              Schedule Demo
            </button>
          </div>

          <p className="text-primary-200 text-sm mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-2">
                  <BriefcaseIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">AuroraHR</span>
              </div>
              <p className="text-gray-400 text-sm">
                Modern HR management platform built for the future of work.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-gray-400">
                © 2025 AuroraHR. All rights reserved.
              </p>
              <div className="flex space-x-6 mt-4 md:mt-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Twitter
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  LinkedIn
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-full shadow-2xl transition-all hover:scale-110 z-50 animate-fade-in"
          aria-label="Scroll to top"
        >
          <ChevronUpIcon className="h-6 w-6" />
        </button>
      )}
    </div>
  );
}
