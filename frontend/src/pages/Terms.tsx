import LegalLayout from '../components/LegalLayout';
import SEOTitle from '../components/SEOTitle';

export default function Terms() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      lastUpdated="May 5, 2026"
    >
      <SEOTitle title="Terms & Conditions" />
      <div className="space-y-12">
        <section>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            This Terms ("Agreement") is a legal agreement between Selorah Health Limited ("Selorah", "us", or "we") and the entity or person ("you", "your", or "User") who registered on the Selorah checkout page or dashboard to receive certain healthcare data management and sharing services. This Agreement describes the terms and conditions that apply to your use of the Services.
          </p>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed">
            If you do not understand any of the terms of this Agreement, please contact us before using the Services. You may not access or use any Services unless you agree to abide by all of the terms and conditions in this Agreement.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Your Selorah Account</h2>
          <div className="space-y-4 text-gray-600">
            <p><strong>1.1 Registration and Permitted Activities:</strong> Only businesses (including sole proprietorships), bona fide charitable organizations, and natural persons are eligible to apply for a Selorah Account to use the Services. To register for a Selorah Account, you or the person or people submitting the application (your "Representative") must provide us with information about you and your healthcare history or business operations.</p>
            <p><strong>1.2 Business Representative:</strong> You and your Representative individually affirm to Selorah that your Representative is authorized to provide the Information described in this Section 1.2 on your behalf and to bind you to this Agreement.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Data Ownership and Privacy</h2>
          <div className="space-y-4 text-gray-600">
            <p><strong>2.1 Patient Ownership:</strong> You retain all right, title, and interest in and to your Medical Records and Personal Health Information (PHI). Selorah does not claim any ownership rights in your data. By using the Services, you grant Selorah a limited license to store, encrypt, and transmit your data solely as necessary to provide the Services to you.</p>
            <p><strong>2.2 Encryption Standards:</strong> Selorah employs industry-standard AES-256 client-side encryption. You acknowledge that if you lose your private access keys, Selorah cannot recover your data, as we do not store unencrypted copies of your records.</p>
            <p><strong>2.3 Data Sharing:</strong> You are solely responsible for managing access to your records via QR codes or shared tokens. Selorah acts as a conduit for your explicit sharing instructions and does not independently share your PHI with third parties without your direct authorization.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Use of Services</h2>
          <div className="space-y-4 text-gray-600">
            <p><strong>3.1 Prohibited Use:</strong> You may not use the Services to store or transmit fraudulent, infringing, or otherwise unlawful material. You may not attempt to reverse engineer or interfere with the proper working of the Selorah platform.</p>
            <p><strong>3.2 Fees and Payment:</strong> Subscription fees for Selorah Pro or stakeholder portal access are billed in advance on a recurring basis. All fees are exclusive of applicable taxes. You are responsible for all taxes associated with your use of the Services.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Termination</h2>
          <div className="space-y-4 text-gray-600">
            <p><strong>4.1 Right to Terminate:</strong> You may terminate this Agreement at any time by closing your Selorah Account. Selorah may terminate this Agreement or suspend your Account if you breach any provision of this Agreement or if we are required to do so by law.</p>
            <p><strong>4.2 Effect of Termination:</strong> Upon termination, your right to use the Services will immediately cease. You are responsible for exporting your data prior to account closure.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            Under no circumstances will Selorah be responsible or liable to you for any indirect, punitive, incidental, special, consequential, or exemplary damages resulting from your use of, or inability to use, the Services or for the loss of profits, sales, business, goodwill or data.
          </p>
        </section>
      </div>
    </LegalLayout>
  );
}
