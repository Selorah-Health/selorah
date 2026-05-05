import LegalLayout from '../components/LegalLayout';
import SEOTitle from '../components/SEOTitle';

export default function Privacy() {
  return (
    <LegalLayout 
      title="Privacy Policy" 
      lastUpdated="May 5, 2026"
    >
      <SEOTitle title="Privacy Policy" />
      <div className="space-y-12">
        <section>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            At Selorah Health, we take your privacy with the utmost seriousness. This Privacy Policy describes how Selorah Health Limited ("Selorah", "we", "us", or "our") collects, uses, and discloses your information in connection with our healthcare data platform.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Information We Collect</h2>
          <div className="space-y-4 text-gray-600">
            <p><strong>1.1 Personal Information:</strong> When you register for a Selorah Account, we collect basic identifiers such as your name, email address, phone number, and date of birth to verify your identity.</p>
            <p><strong>1.2 Health Information:</strong> We host medical records, lab results, and prescriptions that you choose to upload. This data is encrypted on your device before it reaches our servers. We do not have access to the unencrypted content of these records.</p>
            <p><strong>1.3 Usage Data:</strong> We collect metadata about how you interact with our platform (e.g., login times, device types) to improve our security and user experience.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2. How We Use Information</h2>
          <div className="space-y-4 text-gray-600">
            <p>We use the collected information to:
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>Provide and maintain the Selorah platform.</li>
                <li>Verify your identity and prevent fraudulent access.</li>
                <li>Process your transactions and manage your subscription.</li>
                <li>Respond to your support requests.</li>
                <li>Facilitate the sharing of records with healthcare providers at your explicit request.</li>
              </ul>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Data Sharing and Disclosure</h2>
          <div className="space-y-4 text-gray-600">
            <p><strong>3.1 With Your Consent:</strong> We share your PHI only with third parties (such as doctors or researchers) that you have explicitly authorized through QR codes or our dashboard.</p>
            <p><strong>3.2 Anonymized Data:</strong> If you opt-in to research programs, we may share fully anonymized, aggregated data cohorts with verified researchers. You receive compensation for this participation through our Earnings program.</p>
            <p><strong>3.3 Legal Requirements:</strong> We may disclose information if required to do so by law or in response to valid requests by public authorities.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Data Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We implement technical and organizational measures designed to protect the security of your PHI. This includes end-to-end encryption (E2EE) using the AES-256 algorithm. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee its absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            Depending on your location, you may have rights under the Nigeria Data Protection Regulation (NDPR), GDPR, or other privacy laws. These rights may include the right to access, correct, or delete your personal information, or to restrict its processing.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
