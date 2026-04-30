import LegalLayout from '../components/LegalLayout';


export default function Terms() {
  return (
    <LegalLayout 
      title="Terms & Conditions" 
      lastUpdated="April 30, 2026"
    >
      <section className="space-y-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p className="text-gray-700 leading-relaxed">
            By accessing or using Selorah Health, you agree to be bound by these Terms and Conditions. 
            If you do not agree to all the terms and conditions contained herein, you must not use the Service.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p className="text-gray-700 leading-relaxed">
            Selorah Health provides a secure digital platform that allows users to store, manage, share, 
            and potentially monetize their personal health records. Our service includes features such as 
            secure document upload, QR code sharing, and collaboration tools.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Security</h2>
          <p className="text-gray-700 leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for all 
            activities that occur under your account. You agree to notify us immediately of any unauthorized 
            use of your account.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">4. Data Ownership and Rights</h2>
          <p className="text-gray-700 leading-relaxed">
            You retain all ownership rights to your health data. By uploading content to Selorah Health, 
            you grant us a limited, non-exclusive, royalty-free license to host, store, and display your data 
            solely for the purpose of providing the Service.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">5. Pro Subscriptions</h2>
          <p className="text-gray-700 leading-relaxed">
            Selorah Pro offers enhanced features for a yearly subscription fee. All payments are non-refundable. 
            You may cancel your subscription at any time, but no refunds will be issued for partial periods.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">6. Termination</h2>
          <p className="text-gray-700 leading-relaxed">
            We reserve the right to suspend or terminate your access to the Service at our sole discretion 
            if you violate these Terms.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
          <p className="text-gray-700 leading-relaxed">
            To the fullest extent permitted by law, Selorah Health shall not be liable for any indirect, 
            incidental, special, consequential, or punitive damages arising out of or related to your use of the Service.
          </p>
        </div>

        <p className="text-sm text-gray-500 mt-12">
          Last updated: April 30, 2026 • Selorah Health © 2026
        </p>
      </section>
    </LegalLayout>
  );
}
