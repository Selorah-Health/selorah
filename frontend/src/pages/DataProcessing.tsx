import LegalLayout from '../components/LegalLayout';
import SEOTitle from '../components/SEOTitle';

export default function DataProcessing() {
  return (
    <LegalLayout title="Data Processing Agreement" lastUpdated="August 15, 2026">
      <SEOTitle title="Data Processing Agreement" />
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        This Data Processing Agreement (“DPA”) forms part of the agreement between Selorah Health Limited (“Processor”, “Selorah”, “we”) and the institutional customer (“Controller”, “you”) that uses Selorah hospital, research, or insurer portals to process personal data. It applies where Selorah processes personal data on your documented instructions.
      </p>
      <p className="text-sm text-gray-500 mb-12">Estimated reading time: about 7 minutes.</p>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Definitions</h2>
        <p className="text-gray-600">“Personal Data”, “Processing”, “Controller”, “Processor”, “Data Subject”, and “Supervisory Authority” have meanings consistent with the Nigeria Data Protection Act and, where relevant, analogous terms under other applicable privacy laws. “Services” means the Selorah products described in your order or subscription. “Subprocessor” means any third party engaged by Selorah to process Personal Data on behalf of the Controller.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Roles of the Parties</h2>
        <p className="text-gray-600 mb-4">For institutional use cases (hospital directory, controlled access to patient records via tokens, research cohorts under your protocol), you determine the purposes and means of Processing as Controller. Selorah processes Personal Data only to provide the Services and on your documented instructions, unless required by law to act otherwise.</p>
        <p className="text-gray-600">For Selorah’s own account administration, billing, security, and product improvement regarding institutional users’ staff accounts, Selorah may act as an independent controller as described in the Privacy Policy.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Scope, Nature, and Purpose</h2>
        <p className="text-gray-600">Processing includes storage, retrieval, transmission, display, and deletion of Personal Data uploaded or generated in the Services, including health-related records, identifiers (such as patient NIN where stored), access logs, and QR token metadata. The purpose is to deliver secure health-data workflows you configure, not for Selorah’s independent marketing of data subjects’ health information.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Duration</h2>
        <p className="text-gray-600">Processing continues for the term of your agreement with Selorah and any post-termination retention required to wind down the Services, export data, or meet legal obligations, after which Personal Data under this DPA is deleted or returned per Section 12.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Controller Instructions</h2>
        <p className="text-gray-600">Your instructions are documented in the product configuration, APIs, and written agreements. Selorah will inform you if an instruction appears to infringe applicable data protection law (unless legally prohibited). Additional instructions must be agreed in writing and may require changes to fees or timelines.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Confidentiality</h2>
        <p className="text-gray-600">Selorah ensures personnel authorized to process Personal Data are bound by confidentiality obligations and receive appropriate training on handling health and identity data.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Security Measures</h2>
        <p className="text-gray-600 mb-4">Taking into account the state of the art, costs, and risk, Selorah implements measures such as: encryption in transit; access controls and authentication; environment separation; logging and monitoring; vulnerability management; and backup processes. Details may be provided under NDA upon reasonable request.</p>
        <p className="text-gray-600">You are responsible for securing credentials issued to your staff and for lawful collection of patient data before upload or share.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Subprocessors</h2>
        <p className="text-gray-600 mb-4">You authorize Selorah to engage Subprocessors for infrastructure, authentication, storage, email, and similar functions. Selorah will impose data-protection obligations no less protective than those in this DPA. A current list of core subprocessors is available on request.</p>
        <p className="text-gray-600">Selorah will provide notice of material Subprocessor changes where required, and you may object on reasonable data-protection grounds. If objection cannot be resolved, you may terminate the affected Services as your sole remedy.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Transfers</h2>
        <p className="text-gray-600">Where Personal Data is transferred across borders, Selorah will ensure an appropriate transfer mechanism is in place (contractual clauses, adequacy, or other lawful tools). You authorize such transfers as needed to operate the Services.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Assistance with Data Subject Rights</h2>
        <p className="text-gray-600">Taking into account the nature of Processing, Selorah will assist you with reasonable requests to respond to data subject rights (access, correction, deletion, restriction, portability, objection) by providing self-service tools where available and technical support for complex requests. You remain responsible for verifying the requester’s identity and deciding the response.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Breach Notification</h2>
        <p className="text-gray-600">After becoming aware of a Personal Data breach affecting Controller data, Selorah will notify you without undue delay and provide information reasonably available to help you meet your notification duties. Notification is not an admission of fault. The parties will cooperate on investigation and mitigation.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Return or Deletion</h2>
        <p className="text-gray-600">Upon termination of the Services, at your choice Selorah will delete or return Controller Personal Data, unless retention is required by law or needed for residual security logs under reduced access. Certification of deletion may be provided upon written request after completion of standard purge cycles.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Audits</h2>
        <p className="text-gray-600">Upon reasonable written notice, no more than once annually (unless a supervisory authority requires more), Selorah will make available information necessary to demonstrate compliance with this DPA, which may include security summaries or third-party audit reports. On-site audits require mutual agreement on scope, timing, and confidentiality, and costs may be allocated to the requesting Controller if an audit exceeds standard diligence.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Liability, Precedence, and Contact</h2>
        <p className="text-gray-600 mb-4">Liability under this DPA is subject to the limitations in the main commercial agreement between the parties, except where prohibited by law. If there is a conflict between this DPA and other terms regarding data protection, this DPA prevails for Processing under Controller instructions.</p>
        <p className="text-gray-600">Contact for DPA notices: legal@selorah.health and privacy@selorah.health — Selorah Health Limited.</p>
      </section>
    </LegalLayout>
  );
}
