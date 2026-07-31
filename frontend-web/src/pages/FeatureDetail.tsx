import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import BrandedScreenshot from '../components/landing/BrandedScreenshot';
import { getModuleById } from '../data/modulesData';


export default function FeatureDetail() {
  const navigate = useNavigate();
  const { featureId } = useParams<{ featureId: string }>();

  const module = featureId ? getModuleById(featureId) : null;

  // Scroll to top when component mounts or featureId changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [featureId]);

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Module Not Found</h1>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const IconComponent = module.icon;

  const scrollToScreenshots = () => {
    const screenshotsSection = document.getElementById('screenshots-section');
    if (screenshotsSection) {
      screenshotsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-4">
              <img
                src="/brand/aura/aura-logo-exact-transparent.png"
                alt="Aura"
                className="h-8 w-auto cursor-pointer"
                onClick={() => navigate('/')}
              />
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Back</span>
              </button>
            </div>

            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary text-sm py-2 px-4"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section with Header Image - Ultra Compact */}
      <section className="pt-14 relative">
        <div className="relative h-[220px] overflow-hidden">
          <img
            src={module.headerImage}
            alt={module.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-primary-900/90"></div>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg mb-2">
                <IconComponent className="h-6 w-6 text-white" />
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold mb-2 leading-tight text-white">
                {module.title}
              </h1>

              <p className="text-sm text-white/90 leading-snug max-w-2xl mx-auto mb-3">
                {module.longDescription}
              </p>

              <button
                onClick={scrollToScreenshots}
                className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg transition-all text-sm font-medium border border-white/30"
              >
                <span>See It In Action</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section - Ultra Compact Layout */}
      <section className="py-6 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">

          {/* Two Column Layout: Features & Benefits */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">

            {/* Left Column: Key Features */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Key Features
                </h2>
                <p className="text-gray-600 text-xs">
                  Everything you need for {module.title.toLowerCase()}
                </p>
              </div>

              <div className="space-y-2">
                {module.keyFeatures.slice(0, 5).map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-2 bg-gray-50 p-2.5 rounded-md hover:bg-primary-50 transition-colors"
                  >
                    <CheckCircleIcon className="h-4 w-4 text-primary-600 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 leading-snug text-xs">{feature}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Benefits */}
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Benefits
                </h2>
                <p className="text-gray-600 text-xs">
                  Real benefits our customers experience
                </p>
              </div>

              <div className="space-y-3">
                {module.benefits.slice(0, 5).map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-gradient-to-r from-primary-50 to-white rounded-lg border border-primary-100 hover:shadow-md transition-shadow"
                  >
                    <div className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br ${module.gradient} rounded-md`}>
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-gray-700 leading-snug text-xs">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Screenshots Grid - Compact */}
          {module.screenshots && module.screenshots.length > 0 && (
            <div id="screenshots-section" className="mt-8">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1">See It In Action</h2>
                <p className="text-gray-600 text-xs">Real screenshots from the application</p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {module.screenshots.slice(0, 3).map((screenshot, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <BrandedScreenshot
                      src={screenshot}
                      alt={`${module.title} screenshot ${index + 1}`}
                      className="w-full bg-gray-100"
                      imageClassName="w-full h-auto"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section - Compact */}
      <section className={`py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-br ${module.gradient}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready to Transform {module.title}?
          </h2>
          <p className="text-sm text-white/90 mb-4">
            Bring your people operations into Aura. Start your free 14-day trial today.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="btn bg-white text-primary-600 hover:bg-gray-100 text-sm py-2 px-5"
            >
              Start Free Trial
            </button>
            <button
              onClick={() => window.location.href = `mailto:sales@aurahrms.com?subject=Schedule%20Demo%20-%20${encodeURIComponent(module.title)}&body=Hi%2C%0A%0AI%20would%20like%20to%20schedule%20a%20demo%20for%20${encodeURIComponent(module.title)}.%0A%0ACompany%20Name%3A%20%0ANumber%20of%20Employees%3A%20%0APreferred%20Date%2FTime%3A%20%0A%0AThank%20you!`}
              className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 text-sm py-2 px-5"
            >
              Talk to an Expert
            </button>
          </div>

          <p className="text-white/80 text-xs mt-3">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
