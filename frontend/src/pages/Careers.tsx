import LegalLayout from '../components/LegalLayout';

export default function Careers() {
  return (
    <LegalLayout title="Careers">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Join the Revolution
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We're building the future of healthcare data ownership. 
            If you're passionate about privacy, blockchain, and healthcare technology, 
            we'd love to have you on board.
          </p>
        </div>

        {/* Open Roles */}
        <div className="mb-16">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8">Open Roles</h2>
          
          <div className="space-y-6">
            <div className="group bg-white border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Senior Fullstack Engineer
                  </h3>
                  <p className="text-gray-600">Remote • Full-time</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-colors">
                  Apply Now
                </button>
              </div>
            </div>

            <div className="group bg-white border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Product Designer
                  </h3>
                  <p className="text-gray-600">Lagos / Remote • Full-time</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-colors">
                  Apply Now
                </button>
              </div>
            </div>

            <div className="group bg-white border border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                    Medical Data Analyst
                  </h3>
                  <p className="text-gray-600">Remote • Part-time</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-colors">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Perks Section */}
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-8">Why Join Us?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 rounded-3xl p-8">
              <h3 className="font-semibold text-lg mb-6 text-gray-900">Perks &amp; Benefits</h3>
              <ul className="space-y-4 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Flexible working hours
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Comprehensive health insurance
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Competitive salary and equity
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 mt-1">✓</span>
                  Learning and development budget
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-8">
              <h3 className="font-semibold text-lg mb-6 text-gray-900">Our Culture</h3>
              <p className="text-gray-700 leading-relaxed">
                We believe in ownership, transparency, and building products that actually matter. 
                You'll work with a small, high-impact team where your ideas can shape the future of healthcare data.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-6">
            Don't see your role listed? We're always looking for talented people.
          </p>
          <a 
            href="mailto:selorahealth@gmail.com" 
            className="inline-flex items-center px-8 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black transition-colors font-medium"
          >
            Send us your resume →
          </a>
        </div>
      </div>
    </LegalLayout>
  );
}
