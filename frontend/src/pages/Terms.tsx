import LegalLayout from '../components/LegalLayout';
import SEOTitle from '../components/SEOTitle';

export default function Terms() {
  return (
    <LegalLayout title="Terms of Use" lastUpdated="August 15, 2026">
      <SEOTitle title="Terms of Use" />
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        These Terms of Use (“Terms”) form a binding agreement between you (“you”, “User”) and Selorah Health Limited (“Selorah”, “we”, “us”, or “our”) governing access to and use of the Selorah websites, mobile experiences, APIs, hospital, research, and insurer portals, and related services (collectively, the “Services”). By creating an account, joining the waitlist, scanning a QR token, uploading records, or otherwise using the Services, you agree to these Terms. If you do not agree, do not use the Services.
      </p>
      <p className="text-sm text-gray-500 mb-12">Estimated reading time: about 7 minutes.</p>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Eligibility and Account Registration</h2>
        <p className="text-gray-600 mb-4">You must be at least 18 years old (or the age of majority in your jurisdiction) to create a Selorah account. Parents or legal guardians may manage accounts on behalf of minors where permitted by law. You agree to provide accurate registration information, including identity details such as name, email, phone number, and where applicable National Identification Number (NIN) or organization identifiers.</p>
        <p className="text-gray-600">Staff accounts for hospitals, researchers, and insurers may only be opened with authorized organizational credentials. Selorah may require proof of affiliation, professional license, or an organization ID issued at registration. You are responsible for safeguarding passwords and for all activity under your account.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of the Services</h2>
        <p className="text-gray-600 mb-4">Selorah provides tools to store, organize, share, and audit access to personal health information at the user’s direction. Features may include medical record upload, QR-based sharing, patient and provider directories, research study participation, consent management, and related analytics. Features may vary by role (patient, provider/hospital, researcher, insurer) and by subscription tier.</p>
        <p className="text-gray-600">We may modify, suspend, or discontinue features with reasonable notice where practicable. Beta or experimental features are provided “as is” and may change without notice.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Health Information and Your Responsibilities</h2>
        <p className="text-gray-600 mb-4">You remain the data subject (or lawful representative) for personal health information you upload or authorize others to upload. You must only upload information you are entitled to process. You are responsible for verifying that shared records are appropriate for the recipient and purpose.</p>
        <p className="text-gray-600">Selorah is not a medical device manufacturer for diagnostic decision-making unless expressly stated. Content in the Services does not replace professional medical advice, diagnosis, or treatment. Always seek the advice of qualified health providers with questions about a medical condition.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Consent, Sharing, and QR Tokens</h2>
        <p className="text-gray-600 mb-4">Sharing is user-directed. When you generate a share link or QR token, you authorize temporary access under the scope and expiry you select. Hospitals and other recipients must use tokens only for legitimate care, operations, or research purposes consistent with applicable law and their agreements with you or Selorah.</p>
        <p className="text-gray-600">You may revoke active tokens where the product allows. Revocation does not unwind prior lawful access that already occurred. Access events may be logged for transparency and security.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
        <p className="text-gray-600 mb-4">You agree not to: (a) access another user’s data without authorization; (b) probe, scan, or breach security or authentication measures; (c) upload malware or unlawful content; (d) reverse engineer non-open components except as allowed by law; (e) use the Services to harass, discriminate, or commit fraud; (f) misuse organization IDs or impersonate providers; or (g) resell the Services without a written partner agreement.</p>
        <p className="text-gray-600">We may suspend or terminate accounts that violate these rules or that pose risk to patients, partners, or platform integrity.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Fees, Subscriptions, and Research Rewards</h2>
        <p className="text-gray-600 mb-4">Some features require paid plans (for example Pro patient tiers or institutional licenses). Fees, billing cycles, and taxes will be presented at purchase. Unless required by law, fees are non-refundable once a billing period has started. Research participation incentives, if any, are governed by study-specific terms and may be subject to verification, eligibility, and local tax rules.</p>
        <p className="text-gray-600">We may change pricing with notice to affected subscribers. Continued use after the effective date constitutes acceptance of the new price for subsequent periods.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
        <p className="text-gray-600 mb-4">Selorah and its licensors own the Services, branding, software, and documentation. You receive a limited, non-exclusive, non-transferable license to use the Services for their intended purpose. You retain rights in content you lawfully upload, and grant Selorah a limited license to host, process, display, and transmit that content solely to provide the Services and as otherwise described in our Privacy Policy.</p>
        <p className="text-gray-600">Feedback you provide may be used by Selorah without obligation to you.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Privacy and Data Protection</h2>
        <p className="text-gray-600 mb-4">Processing of personal data is described in our Privacy Policy and, where applicable, Data Processing Agreement. By using the Services you acknowledge those documents. Where you act as a controller (for example a hospital using the portal for patients), you must have a lawful basis and appropriate notices for processing.</p>
        <p className="text-gray-600">Cross-border transfers, retention, and security measures are detailed in the Privacy Policy. Contact privacy@selorah.health for data protection inquiries.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Third-Party Services and Integrations</h2>
        <p className="text-gray-600 mb-4">The Services may integrate identity providers, cloud infrastructure, payment processors, messaging, or blockchain-related attestations. Third-party terms apply to those components. Selorah is not responsible for third-party outages or policies outside our control, but we will take reasonable steps to select reputable processors.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimers</h2>
        <p className="text-gray-600 mb-4">EXCEPT AS EXPRESSLY STATED IN WRITING, THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT RECORDS WILL BE COMPLETE OR CLINICALLY SUITABLE FOR EVERY USE CASE.</p>
        <p className="text-gray-600">Emergency care should never rely solely on availability of the Selorah platform.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Limitation of Liability</h2>
        <p className="text-gray-600 mb-4">TO THE MAXIMUM EXTENT PERMITTED BY LAW, SELORAH AND ITS AFFILIATES, OFFICERS, AND SUPPLIERS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, OR GOODWILL. OUR AGGREGATE LIABILITY ARISING OUT OF THESE TERMS OR THE SERVICES WILL NOT EXCEED THE GREATER OF (A) FEES YOU PAID TO SELORAH IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE HUNDRED US DOLLARS (OR LOCAL EQUIVALENT).</p>
        <p className="text-gray-600">Some jurisdictions do not allow certain limitations; in those cases our liability is limited to the fullest extent permitted.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Indemnity</h2>
        <p className="text-gray-600">You agree to defend and indemnify Selorah against claims arising from your misuse of the Services, violation of these Terms, infringement of third-party rights, or unlawful processing of health data under your control, except to the extent caused by Selorah’s willful misconduct.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Termination</h2>
        <p className="text-gray-600 mb-4">You may stop using the Services at any time. We may suspend or terminate access for breach, legal risk, non-payment, or extended inactivity. Upon termination, your license ends. We may retain data as required by law, legitimate interests, or backup cycles, as described in the Privacy Policy.</p>
        <p className="text-gray-600">Sections that by nature should survive (including intellectual property, disclaimers, liability limits, and indemnity) will survive termination.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Governing Law, Disputes, and Changes</h2>
        <p className="text-gray-600 mb-4">These Terms are governed by the laws of Nigeria, without regard to conflict-of-law rules, unless mandatory consumer protections in your country of residence apply. Courts in Lagos, Nigeria shall have exclusive jurisdiction, subject to any non-waivable rights to bring claims in your local courts.</p>
        <p className="text-gray-600 mb-4">We may update these Terms by posting a revised version and updating the “Last Updated” date. Material changes will be communicated through the Services or email where appropriate. Continued use after the effective date constitutes acceptance.</p>
        <p className="text-gray-600">Contact: legal@selorah.health — Selorah Health Limited.</p>
      </section>
    </LegalLayout>
  );
}
