import LegalLayout from '../components/LegalLayout';

export default function DataProcessing() {
  return (
    <LegalLayout title="Data Processing Agreement" lastUpdated="April 30, 2026">
      <section>
        <h2>1. Scope of Agreement</h2>
        <p>This Data Processing Agreement ("DPA") applies to the processing of personal data by Selorah Health on behalf of its users.</p>
      </section>

      <section>
        <h2>2. Responsibilities</h2>
        <p>Selorah Health acts as a data processor, and the user acts as a data controller. Both parties agree to comply with relevant data protection laws, including GDPR and NDPR.</p>
      </section>

      <section>
        <h2>3. Technical and Organizational Measures</h2>
        <p>We implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk, including encryption and access controls.</p>
      </section>

      <section>
        <h2>4. Sub-processors</h2>
        <p>We use sub-processors for certain services (e.g., Supabase for database hosting). We ensure that these sub-processors provide equivalent levels of data protection.</p>
      </section>
    </LegalLayout>
  );
}
