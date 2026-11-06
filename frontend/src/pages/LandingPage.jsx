import { useEffect } from 'react';
import Navbar from '../components/homepage/Navbar';
import HeroSection from '../components/homepage/HeroSection';
import ProductShowcase from '../components/homepage/ProductShowcase';
import WorkflowSection from '../components/homepage/WorkflowSection';
import CapabilitiesSection from '../components/homepage/CapabilitiesSection';
import KpiSection from '../components/homepage/KpiSection';
import TrustSection from '../components/homepage/TrustSection';
import FinalCtaSection from '../components/homepage/FinalCtaSection';
import Footer from '../components/homepage/Footer';
import NeuralStream from '../components/homepage/NeuralStream';
import FabricCanvas from '../components/homepage/FabricCanvas';
import './landing.css';

export default function LandingPage() {
  // Reveal on scroll observer for clean entrance
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-page">
      {/* PHYSICAL SOFT FABRIC MOTION BACKGROUND LAYER */}
      <FabricCanvas />

      {/* SECTION A — NAVIGATION */}
      <Navbar />

      <main className="landing-main-content">
        {/* SECTION B — HERO (3D Human Intelligence Core) */}
        <HeroSection />

        {/* NEURAL STREAM 1: Hero descending into Product Streams */}
        <NeuralStream variant="hero-to-product" />

        {/* SECTION C — PRODUCT INTRODUCTION / WORKSPACE PREVIEW */}
        <div className="reveal-on-scroll">
          <ProductShowcase />
        </div>

        {/* NEURAL STREAM 2: Product streams into Workflow conduits */}
        <NeuralStream variant="product-to-workflow" />

        {/* SECTION D — HOW IT WORKS (Connected 5-Stage Financial Workflow) */}
        <div className="reveal-on-scroll">
          <WorkflowSection />
        </div>

        {/* NEURAL STREAM 3: Workflow channels into Capabilities */}
        <NeuralStream variant="workflow-to-capabilities" />

        {/* SECTION E — CAPABILITIES MATRIX */}
        <div className="reveal-on-scroll">
          <CapabilitiesSection />
        </div>

        {/* NEURAL STREAM 4: Capabilities converging into Financial KPIs */}
        <NeuralStream variant="capabilities-to-kpis" />

        {/* SECTION F — FINANCIAL INSIGHTS & RIGOROUS KPIS */}
        <div className="reveal-on-scroll">
          <KpiSection />
        </div>

        {/* SECTION G — TRUST, GOVERNANCE & HUMAN-IN-THE-LOOP */}
        <div className="reveal-on-scroll">
          <TrustSection />
        </div>

        {/* NEURAL STREAM 5: Governance resolving into Final CTA Convergence */}
        <NeuralStream variant="governance-to-cta" />

        {/* SECTION H — FINAL CALL TO ACTION */}
        <div className="reveal-on-scroll">
          <FinalCtaSection />
        </div>
      </main>

      {/* SECTION I — FOOTER */}
      <Footer />
    </div>
  );
}
