import LegalLayout from '../components/LegalLayout';
import SEOTitle from '../components/SEOTitle';

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="August 15, 2026">
      <SEOTitle title="Cookie Policy" />
      <p className="text-lg text-gray-600 mb-8 leading-relaxed">
        This Cookie Policy explains how Selorah Health Limited (“Selorah”, “we”, “us”) uses cookies and similar technologies on our websites, web apps, and portals (the “Services”). It should be read with our Privacy Policy and Terms of Use.
      </p>
      <p className="text-sm text-gray-500 mb-12">Estimated reading time: about 6 minutes.</p>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
        <p className="text-gray-600">Cookies are small text files stored on your device when you visit a site. Similar technologies include local storage, session storage, pixels, and software development kits (SDKs) that store or read identifiers. They help sites remember preferences, keep you signed in, and understand how the product is used.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Who Places Cookies</h2>
        <p className="text-gray-600">First-party cookies are set by Selorah. Third-party cookies may be set by providers we use for hosting, analytics, authentication, or communications, under contracts that limit their use of your data.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Categories We Use</h2>
        <p className="text-gray-600 mb-4"><strong>Strictly necessary:</strong> required for security, load balancing, session management, and core features such as login. These do not require consent in most jurisdictions but can still be disclosed here.</p>
        <p className="text-gray-600 mb-4"><strong>Functional:</strong> remember language, UI preferences, or dismissed banners.</p>
        <p className="text-gray-600 mb-4"><strong>Analytics:</strong> help us understand traffic and feature usage in aggregate.</p>
        <p className="text-gray-600"><strong>Marketing:</strong> used only if enabled, to measure campaigns or show relevant messages. Not used to sell health data.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Why We Use Them</h2>
        <p className="text-gray-600">We use cookies to authenticate users, protect against abuse, maintain sessions across pages, store non-sensitive preferences, measure performance, and improve navigation. For authenticated product areas, session cookies or tokens are essential to keep your account secure.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Local Storage and App State</h2>
        <p className="text-gray-600">The Selorah web app may store limited data in browser local storage (for example a cached display name or role hint) to improve load times. This is not a substitute for server-side security. Clearing site data will remove these items and may require you to sign in again.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Duration</h2>
        <p className="text-gray-600 mb-4"><strong>Session cookies</strong> expire when you close the browser or after a short idle period.</p>
        <p className="text-gray-600"><strong>Persistent cookies</strong> remain until they expire or you delete them. Expiry periods vary by purpose (for example preference cookies may last months; security cookies may rotate more often).</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Consent Management</h2>
        <p className="text-gray-600">Where required by law, non-essential cookies are used only after you accept them via a banner or settings control. You can withdraw consent by clearing cookies and adjusting preferences. Strictly necessary cookies will continue to operate so the Services remain usable and secure.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">8. How to Control Cookies in Your Browser</h2>
        <p className="text-gray-600 mb-4">Most browsers let you block or delete cookies via settings. Blocking all cookies may prevent login or break core features. Refer to help pages for Chrome, Firefox, Safari, Edge, or your mobile browser for step-by-step instructions.</p>
        <p className="text-gray-600">Device-level advertising identifiers on mobile can often be reset in system settings.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Do Not Track and Global Privacy Controls</h2>
        <p className="text-gray-600">Some browsers send “Do Not Track” signals. There is no uniform industry response standard. Where Global Privacy Control or similar signals are legally recognized and technically detectable, we will treat them as required by applicable law.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Analytics Providers</h2>
        <p className="text-gray-600">If we enable analytics tools, they may set cookies or use IP truncation and similar privacy configurations. Analytics data is used to improve reliability and UX, not to determine individual medical decisions.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Third-Party Embeds</h2>
        <p className="text-gray-600">Pages may occasionally embed content (for example maps, video, or payment widgets) that set their own cookies. Those providers are responsible for their technologies; review their policies if you interact with embedded content.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Updates to This Policy</h2>
        <p className="text-gray-600">We may update this Cookie Policy when our practices or vendors change. The “Last Updated” date will change accordingly. Continued use of the Services after updates constitutes awareness of the revised policy where permitted by law.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Relationship to Privacy Policy</h2>
        <p className="text-gray-600">Personal data collected via cookies is processed under the Privacy Policy, including rights of access, deletion, and complaint. Cookie identifiers alone are often limited, but may be combined with account data when you are logged in.</p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact</h2>
        <p className="text-gray-600">Questions about cookies: privacy@selorah.health — Selorah Health Limited. For general privacy rights requests, use the same address and describe your request clearly.</p>
      </section>
    </LegalLayout>
  );
}
