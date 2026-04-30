import LegalLayout from '../components/LegalLayout';

export default function Terms() {
  return (
    <LegalLayout title="Terms & Conditions" lastUpdated="April 30, 2026">
      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing and using Selorah Health, you agree to be bound by these Terms and Conditions. If you do not agree to all of these terms, do not use the service.</p>
      </section>

      <section>
        <h2>2. Use of Service</h2>
        <p>Selorah Health provides a secure platform for managing health records. You are responsible for maintaining the confidentiality of your account credentials.</p>
      </section>

      <section>
        <h2>3. Data Ownership</h2>
        <p>You retain all rights to your health data. Selorah Health provides the tools to manage, share, and monetize this data at your sole discretion.</p>
      </section>

      <section>
        <h2>4. Pro Subscriptions</h2>
        <p>Selorah Pro provides enhanced features for a yearly fee. Subscriptions are non-refundable but can be canceled at any time.</p>
      </section>
    </LegalLayout>
  );
}
