import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import CTA from '@/components/landing/CTA';
import Footer from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col animate-[fade-in_1s_ease-out_forwards]">
        <Hero />
        <Features />
        <CTA />
      </main>

      <Footer />

      {/* Global animations for landing page */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
