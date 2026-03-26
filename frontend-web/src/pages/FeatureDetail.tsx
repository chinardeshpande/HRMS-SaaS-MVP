import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { getModuleById } from '../data/modulesData';


export default function FeatureDetail() {
  const navigate = useNavigate();
  const { featureId } = useParams<{ featureId: string }>();

  const module = featureId ? getModuleById(featureId) : null;

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

  return (
    <div className="bg-white min-h-screen">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="font-medium">Back to Home</span>
            </button>

            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br ${module.gradient} text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <IconComponent className="h-10 w-10 text-white" />
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {module.title}
            </h1>

            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              {module.longDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Product Screenshots */}
      {module.screenshots && module.screenshots.length > 0 && (
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">See It In Action</h2>
              <p className="text-lg text-gray-600">Real screenshots from the application</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {module.screenshots.map((screenshot, index) => (
                <div key={index} className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-2xl transition-shadow">
                  <img
                    src={screenshot}
                    alt={`${module.title} screenshot ${index + 1}`}
                    className="w-full h-auto rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Key Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Key Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need for {module.title.toLowerCase()}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {module.keyFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-start space-x-3 bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow"
              >
                <CheckCircleIcon className={`h-6 w-6 text-${module.color}-600 flex-shrink-0 mt-1`} />
                <p className="text-gray-700 leading-relaxed">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Benefits
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real benefits our customers experience
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {module.benefits.map((benefit, index) => (
              <div
                key={index}
                className="text-center p-8 bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${module.gradient} rounded-2xl mb-6`}>
                  <CheckCircleIcon className="h-10 w-10 text-white" />
                </div>
                <p className="text-gray-700 text-lg leading-relaxed">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br ${module.gradient}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform {module.title}?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join 500+ companies using AuroraHR. Start your free 14-day trial today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg"
            >
              Start Free Trial
            </button>
            <button className="btn btn-outline border-white text-white hover:bg-white hover:text-primary-600 btn-lg">
              Schedule Demo
            </button>
          </div>

          <p className="text-white/80 text-sm mt-6">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
