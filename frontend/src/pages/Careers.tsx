import LegalLayout from '../components/LegalLayout';

export default function Careers() {
  return (
    <LegalLayout title="Careers">
      <section>
        <h2>Join the Revolution</h2>
        <p>We are building the future of healthcare data. If you are passionate about privacy, blockchain, or healthcare technology, we'd love to hear from you.</p>
      </section>

      <section>
        <h2>Open Roles</h2>
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-[#101217]">Senior Fullstack Engineer</h3>
            <p className="text-sm text-gray-500">Remote • Full-time</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-[#101217]">Product Designer</h3>
            <p className="text-sm text-gray-500">Lagos / Remote • Full-time</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-[#101217]">Medical Data Analyst</h3>
            <p className="text-sm text-gray-500">Remote • Part-time</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Perks</h2>
        <ul>
          <li>Flexible working hours</li>
          <li>Comprehensive health insurance</li>
          <li>Competitive salary and equity</li>
          <li>Learning and development budget</li>
        </ul>
      </section>
    </LegalLayout>
  );
}
