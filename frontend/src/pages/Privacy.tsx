import LegalLayout from '../components/LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="April 30, 2026">
      <section>
        <h2>1. Data Collection</h2>
        <p>We collect information you provide directly to us, including your name, contact information, and health records you choose to upload.</p>
      </section>

      <section>
        <h2>2. Data Security</h2>
        <p>We use industry-standard encryption to protect your data. Your health records are encrypted at rest and in transit.</p>
      </section>

      <section>
        <h2>3. Third-Party Sharing</h2>
        <p>We do not share your health data with third parties without your explicit consent. You control who has access to your records via QR codes and secure links.</p>
      </section>

      <section>
        <h2>4. Your Rights</h2>
        <p>You have the right to access, correct, or delete your personal information at any time through your account settings.</p>
      </section>
    </LegalLayout>
  );
}
