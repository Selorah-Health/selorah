import LegalLayout from '../components/LegalLayout';

export default function Careers() {
  return (
    <LegalLayout title="Careers" className="text-primary">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16">
          <h1> Join the Revolution </h1>
          <p>
            We're building the future of healthcare data ownership. 
            If you're passionate about privacy, blockchain, and healthcare technology, 
            we'd love to have you on board.
          </p>
        </div>

        {/* Open Roles */}
        <div className="mb-20">
          <h2 className="text-3xl font-semibold text-gray-900 mb-10">Open Roles</h2>

          <div className="grid gap-6">
            {/* Role 1 */}
            <div className="group bg-white border border-gray-200 hover:border-blue-600 hover:shadow-2xl transition-all duration-300 rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Senior Fullstack Engineer</h3>
                  <p className="text-gray-600">Remote • Full-time</p>
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    Build scalable web applications using modern technologies (React, Node.js, TypeScript). 
                    Work on secure health data systems and blockchain integration.
                  </p>
                </div>
                <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors whitespace-nowrap">
                  Apply Now
                </button>
              </div>
            </div>

            {/* Role 2 */}
            <div className="group bg-white border border-gray-200 hover:border-blue-600 hover:shadow-2xl transition-all duration-300 rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Product Designer</h3>
                  <p className="text-gray-600">Lagos / Remote • Full-time</p>
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    Design intuitive and beautiful user experiences for patients, doctors, and healthcare organizations. 
                    You’ll own the end-to-end design process from research to high-fidelity prototypes.
                  </p>
                </div>
                <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors whitespace-nowrap">
                  Apply Now
                </button>
              </div>
            </div>

            {/* Role 3 */}
            <div className="group bg-white border border-gray-200 hover:border-blue-600 hover:shadow-2xl transition-all duration-300 rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Medical Data Analyst</h3>
                  <p className="text-gray-600">Remote • Part-time</p>
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    Analyze health data to generate insights while ensuring strict privacy and compliance standards. 
                    Work closely with engineering and product teams.
                  </p>
                </div>
                <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors whitespace-nowrap">
                  Apply Now
                </button>
              </div>
            </div>

            {/* Role 4 - New */}
            <div className="group bg-white border border-gray-200 hover:border-blue-600 hover:shadow-2xl transition-all duration-300 rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Blockchain Engineer</h3>
                  <p className="text-gray-600">Remote • Full-time</p>
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    Design and implement secure, privacy-preserving solutions using blockchain and decentralized technologies 
                    for health record ownership and sharing.
                  </p>
                </div>
                <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors whitespace-nowrap">
                  Apply Now
                </button>
              </div>
            </div>

            {/* Role 5 - New */}
            <div className="group bg-white border border-gray-200 hover:border-blue-600 hover:shadow-2xl transition-all duration-300 rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">Frontend Engineer (React)</h3>
                  <p className="text-gray-600">Remote • Full-time</p>
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    Create fast, accessible, and delightful user interfaces using React, TypeScript, and Tailwind CSS. 
                    Focus on performance and exceptional user experience.
                  </p>
                </div>
                <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors whitespace-nowrap">
                  Apply Now
                </button>
              </div>
            </div>

            {/* Role 6 - New */}
            <div className="group bg-white border border-gray-200 hover:border-blue-600 hover:shadow-2xl transition-all duration-300 rounded-3xl p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-2">DevOps &amp; Security Engineer</h3>
                  <p className="text-gray-600">Remote • Full-time</p>
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    Build and maintain secure, scalable cloud infrastructure with strong focus on data protection, 
                    compliance, and system reliability.
                  </p>
                </div>
                <button className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-2xl transition-colors whitespace-nowrap">
                  Apply Now
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Perks & Culture */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-100 rounded-3xl p-10">
            <h3 className="text-2xl font-semibold mb-8">Perks &amp; Benefits</h3>
            <ul className="space-y-5 text-lg text-gray-700">
              <li className="flex items-start gap-4"><span className="text-green-500 text-xl">✓</span> Flexible working hours</li>
              <li className="flex items-start gap-4"><span className="text-green-500 text-xl">✓</span> Comprehensive health insurance</li>
              <li className="flex items-start gap-4"><span className="text-green-500 text-xl">✓</span> Competitive salary + equity</li>
              <li className="flex items-start gap-4"><span className="text-green-500 text-xl">✓</span> Learning &amp; development budget</li>
              <li className="flex items-start gap-4"><span className="text-green-500 text-xl">✓</span> Remote-first culture</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-100 rounded-3xl p-10">
            <h3 className="text-2xl font-semibold mb-8">Our Culture</h3>
            <p className="text-gray-700 leading-relaxed text-lg">
              We are a small but mighty team of builders who believe technology should empower people — 
              especially in healthcare. Transparency, ownership, and continuous learning are at the core of everything we do.
            </p>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-20 text-center">
          <p className="text-gray-600 text-lg mb-6">
            Don’t see a role that matches your profile? We’re always open to exceptional talent.
          </p>
          <a 
            href="mailto:selorahealth@gmail.com" 
            className="inline-flex items-center gap-3 px-10 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-lg font-medium transition-colors"
          >
            Send us your resume →
          </a>
        </div>
      </div>
    </LegalLayout>
  );
}
