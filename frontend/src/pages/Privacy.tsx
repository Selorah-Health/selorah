import LegalLayout from '../components/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout 
      title="Privacy Policy" 
      lastUpdated="April 30, 2026"
    >
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p className="text-gray-700 leading-relaxed">
            At Selorah Health, we take your privacy seriously. This Privacy Policy explains how we collect, 
            use, disclose, and safeguard your information when you use our platform.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
          <p className="text-gray-700 leading-relaxed">
            We collect information you provide directly, such as when you create an account, upload health 
            records, or communicate with us. This may include personal information, contact details, and sensitive 
            health data.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="text-gray-700 leading-relaxed">
            We use your information to provide, maintain, and improve our services, process transactions, 
            communicate with you, and ensure the security of your data.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">4. Data Security</h2>
          <p className="text-gray-700 leading-relaxed">
            We implement industry-standard security measures, including encryption at rest and in transit, 
            to protect your personal and health information.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">5. Sharing of Information</h2>
          <p className="text-gray-700 leading-relaxed">
            We do not sell your personal data. We may share your information only with your explicit consent 
            (e.g., when you share records via secure links or QR codes) or when required by law.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
          <p className="text-gray-700 leading-relaxed">
            You have the right to access, correct, update, or delete your personal information. 
            You may also withdraw consent for certain data processing activities at any time through your account settings.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
          <p className="text-gray-700 leading-relaxed">
            We use cookies and similar technologies to enhance your experience and analyze usage of our Service.
          </p>
        </div>

        <p className="text-sm text-gray-500 mt-12">
          Last updated: April 30, 2026 • Selorah Health © 2026
        </p>
      </section>
    </LegalLayout>
  );
}
