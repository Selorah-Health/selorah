import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import SEOTitle from '../components/SEOTitle';
import LandingSections from '../components/landing';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden selection:bg-primary/30 selection:text-primary">
      <SEOTitle title="The OS for Health Records" />
      <Header />

      <LandingSections />

      <Footer />
    </div>
  );
}
