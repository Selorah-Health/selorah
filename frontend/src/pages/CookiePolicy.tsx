import LegalLayout from '../components/LegalLayout';

export default function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="April 30, 2026">
      <section>
        <h2>What are Cookies?</h2>
        <p>Cookies are small text files that are stored on your device when you visit a website. They help the website remember your preferences and improve your experience.</p>
      </section>

      <section>
        <h2>How We Use Cookies</h2>
        <p>We use cookies to keep you logged in, remember your settings, and analyze how our service is used to improve it.</p>
      </section>

      <section>
        <h2>Types of Cookies We Use</h2>
        <ul>
          <li><strong>Essential:</strong> Required for the website to function correctly.</li>
          <li><strong>Analytical:</strong> Help us understand how visitors interact with the site.</li>
          <li><strong>Functional:</strong> Remember your choices (like language or region).</li>
        </ul>
      </section>
    </LegalLayout>
  );
}
