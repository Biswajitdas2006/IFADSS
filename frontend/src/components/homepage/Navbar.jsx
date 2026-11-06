import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiMenu, FiX } from 'react-icons/fi';

const NAV_ITEMS = [
  { href: '#product', label: 'Product', id: 'product' },
  { href: '#workflow', label: 'Workflow', id: 'workflow' },
  { href: '#capabilities', label: 'Capabilities', id: 'capabilities' },
  { href: '#metrics', label: 'Financial Insights', id: 'metrics' },
  { href: '#governance', label: 'Governance', id: 'governance' },
];

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [navTheme, setNavTheme] = useState('green');

  const closeMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    let rafId = null;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 20);

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
        setScrollProgress(progress);
      }

      // Dynamic Theme Detection:
      // When background under navbar is green -> top bar is green
      // When background under navbar is white -> top bar is white
      const probeY = 40;
      const themeSections = [
        { id: 'hero', theme: 'green', fallback: '.landing-hero' },
        { id: 'product', theme: 'white', fallback: '.product-overview-section' },
        { id: 'workflow', theme: 'green', fallback: '.workflow-section' },
        { id: 'capabilities', theme: 'white', fallback: '.capabilities-section' },
        { id: 'metrics', theme: 'white', fallback: '.kpi-section' },
        { id: 'governance', theme: 'white', fallback: '.trust-section' },
        { id: null, theme: 'green', fallback: '.landing-cta' },
        { id: 'footer', theme: 'green', fallback: '.landing-footer' },
      ];

      let detected = null;
      for (let i = 0; i < themeSections.length; i++) {
        const s = themeSections[i];
        const el = (s.id && document.getElementById(s.id)) || (s.fallback && document.querySelector(s.fallback));
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= probeY && rect.bottom > probeY) {
            detected = s.theme;
            break;
          }
        }
      }

      if (detected) {
        setNavTheme(detected);
      } else {
        setNavTheme(scrollY < 350 ? 'green' : 'white');
      }
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          handleScroll();
          rafId = null;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    handleScroll();

    // Section active observer
    const sectionIds = ['product', 'workflow', 'capabilities', 'metrics', 'governance'];
    const observers = [];

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        const obs = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                setActiveSection(id);
              }
            });
          },
          { rootMargin: '-20% 0px -50% 0px', threshold: 0.1 }
        );
        obs.observe(el);
        observers.push(obs);
      }
    });

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  return (
    <header className={`landing-header is-fixed is-theme-${navTheme} ${isScrolled ? 'is-scrolled' : ''}`}>
      {/* Scroll Progress Beam */}
      <div
        className="nav-scroll-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <div className="landing-container landing-header-inner">
        {/* Brand Logo */}
        <Link className="landing-brand" to="/" aria-label="IFADSS Home" onClick={closeMenu}>
          <span className="landing-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
              <path
                d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 8V16M8 12H16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="brand-text-block">
            <strong className="brand-title">IFADSS</strong>
            <span className="brand-subtitle">Financial Intelligence Platform</span>
          </span>
        </Link>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="landing-menu-button"
          aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={mobileMenuOpen}
          aria-controls="landing-nav"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
        </button>

        {/* Navigation Items */}
        <nav
          className={`landing-nav ${mobileMenuOpen ? 'is-open' : ''}`}
          id="landing-nav"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={item.href}
              className={activeSection === item.id ? 'is-active' : ''}
              onClick={closeMenu}
            >
              {item.label}
            </a>
          ))}

          <div className="landing-nav-actions">
            <Link className="landing-login-link" to="/login" onClick={closeMenu}>
              Sign in
            </Link>
            <Link
              className="landing-button landing-button-primary"
              to="/register"
              onClick={closeMenu}
            >
              <span>Create account</span>
              <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

