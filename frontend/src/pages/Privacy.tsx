import LegalLayout from '../components/LegalLayout';
import SEOTitle from '../components/SEOTitle';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="August 15, 2026">
      <SEOTitle title="Privacy Policy" />
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        Selorah Health Limited (“Selorah”, “we”, “us”) respects your privacy. This Privacy Policy explains how we collect, use, store, share, and protect personal data when you use Selorah websites, apps, portals, and related services (the “Services”). It applies to patients, healthcare providers, researchers, insurers, and visitors.
      </p>
      <p className="text-sm text-gray-500 mb-12">Estimated reading time: about 7 minutes.</p>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Who We Are and Scope</h2>
        <p className="text-gray-600 mb-4">Selorah Health Limited is the primary entity responsible for the Selorah platform. Depending on the context, we may act as a data controller (for account data, product analytics, and platform security) or as a data processor (when a hospital or research institution instructs us to process patient data under a Data Processing Agreement).</p>
        <p className="text-gray-600">This Policy should be read together with our Terms of Use, Cookie Policy, and any role-specific notices shown in the product.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Data We Collect</h2>
        <p className="text-gray-600 mb-4"><strong>Identity and account data:</strong> name, email, phone number, password hashes, role (patient, provider, researcher, insurer), organization ID, National Identification Number (NIN) where you provide it, language and country preferences.</p>
        <p className="text-gray-600 mb-4"><strong>Health and profile data:</strong> records you upload (titles, types, files), date of birth, blood group, genotype, and other profile fields you choose to store; emergency contacts where provided.</p>
        <p className="text-gray-600 mb-4"><strong>Usage and technical data:</strong> device type, browser, IP address, approximate location derived from IP, log events, access logs for shared records, crash diagnostics.</p>
        <p className="text-gray-600"><strong>Transactional data:</strong> subscription status, limited payment metadata from processors (we do not store full card numbers), research reward or withdrawal records where applicable.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Collect Data</h2>
        <p className="text-gray-600 mb-4">We collect data directly from you (registration, onboarding, uploads, forms), automatically through cookies and similar technologies (see Cookie Policy), and from authorized parties when you share records via QR tokens or invite a provider. We may receive limited data from identity or payment providers solely to complete authentication or billing.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Purposes and Legal Bases</h2>
        <p className="text-gray-600 mb-4">We process data to: provide and secure the Services; authenticate users (including email, phone, or NIN login flows); enable record sharing and audit trails; improve product performance; communicate service notices; process payments; comply with law; and, with consent where required, send product updates or research opportunities.</p>
        <p className="text-gray-600">Legal bases may include contract performance, legitimate interests (security, product improvement balanced against your rights), consent (marketing, certain cookies, optional research), and legal obligation.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Special Category / Health Data</h2>
        <p className="text-gray-600 mb-4">Health data is sensitive. We process it to provide the Services you request, based on your explicit actions (upload, share) and applicable health-data rules in your jurisdiction. Hospitals and researchers using Selorah must ensure they have an independent lawful basis for any processing they control.</p>
        <p className="text-gray-600">We design access controls so that staff portals only reach patient data through authorized workflows (for example valid QR tokens or patient-directed share).</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Sharing and Recipients</h2>
        <p className="text-gray-600 mb-4">We share data with: (a) recipients you authorize via share links or QR; (b) infrastructure and subprocessors (hosting, auth, storage, email) bound by contracts; (c) payment providers; (d) professional advisors under confidentiality; (e) authorities when required by law or to protect rights and safety.</p>
        <p className="text-gray-600">We do not sell personal health information. Aggregated or de-identified insights may be used for product and public-health analytics in ways that do not reasonably identify you.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. International Transfers</h2>
        <p className="text-gray-600">Data may be processed in countries other than where you live, including infrastructure regions used by our cloud providers. Where required, we use appropriate safeguards such as contractual clauses, vendor assessments, and access controls. You may request information about relevant safeguards by contacting us.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Retention</h2>
        <p className="text-gray-600 mb-4">We retain account and health records for as long as your account is active and as needed to provide the Services. After deletion requests or account closure, we remove or anonymize personal data within a reasonable period, except where retention is required for legal claims, audits, security logs, or statutory obligations.</p>
        <p className="text-gray-600">Access logs and security events may be kept for longer than primary records to investigate abuse.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Security</h2>
        <p className="text-gray-600 mb-4">We implement administrative, technical, and organizational measures appropriate to the risk, including encryption in transit, access control, authentication, and monitoring. No method of transmission or storage is fully secure; you should use strong unique passwords and protect devices used to access Selorah.</p>
        <p className="text-gray-600">Report suspected incidents to security@selorah.health promptly.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Your Rights</h2>
        <p className="text-gray-600 mb-4">Depending on applicable law, you may have rights to access, correct, delete, restrict, or port your data, and to object to certain processing or withdraw consent. You may manage many profile fields in Settings. For formal requests, email privacy@selorah.health with enough detail to verify your identity.</p>
        <p className="text-gray-600">You may lodge a complaint with a supervisory authority where available. We encourage you to contact us first so we can resolve concerns.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Children</h2>
        <p className="text-gray-600">The Services are not directed to children under 18 creating accounts on their own. Where a parent or guardian manages a minor’s health information, they are responsible for providing appropriate consent and accurate data.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Cookies and Similar Technologies</h2>
        <p className="text-gray-600">We use cookies and similar technologies as described in our Cookie Policy. Essential cookies support login and security; optional cookies support analytics or preferences where you consent.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Automated Decisions and Profiling</h2>
        <p className="text-gray-600">We do not make solely automated decisions that produce legal or similarly significant effects about you without human involvement, except as clearly disclosed for a specific feature (for example fraud checks). Product recommendations or ranking inside the app, if any, are for convenience and can be disregarded.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Changes and Contact</h2>
        <p className="text-gray-600 mb-4">We may update this Privacy Policy by posting a new version with a revised “Last Updated” date. Material changes will be highlighted in the product or by email where appropriate.</p>
        <p className="text-gray-600">Privacy contact: privacy@selorah.health — Selorah Health Limited. For processor arrangements, see the Data Processing Agreement.</p>
      </section>
    </LegalLayout>
  );
}
