import { useEffect, useRef, useState } from 'react';

/**
 * CurtainReveal — Cinematic Scroll-Linked Layered Transitions
 * Progressively reveals sections through layered visual masks and curved boundaries
 * as the user naturally scrolls, with zero scroll hijacking or navigation delays.
 */
export default function CurtainReveal({
  children,
  variant = 'curved-curtain',
  theme = 'light',
  className = '',
  id,
}) {
  const containerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let rafId = null;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Start reveal when section top reaches bottom of viewport (rect.top <= windowHeight)
      // Complete reveal when top reaches ~15% from top of viewport
      const start = windowHeight;
      const end = windowHeight * 0.15;

      const rawProgress = (start - rect.top) / (start - end);
      const clamped = Math.max(0, Math.min(1, rawProgress));

      setScrollProgress(clamped);
      setInView(rect.top < windowHeight && rect.bottom > 0);
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
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  // Compute fluid curtain clip-paths based on scrollProgress
  let maskStyle = {};
  if (!reducedMotion) {
    if (scrollProgress >= 1) {
      maskStyle = {
        clipPath: 'none',
        WebkitClipPath: 'none',
      };
    } else if (variant === 'curved-curtain') {
      // Fluid expanding curved ellipse from top center
      const yRadius = 60 + scrollProgress * 45; // 60% to 105%
      maskStyle = {
        clipPath: `ellipse(150% ${yRadius}% at 50% 0%)`,
        WebkitClipPath: `ellipse(150% ${yRadius}% at 50% 0%)`,
      };
    } else if (variant === 'layered-dark-curtain') {
      // Deep emerald curtain reveal: angled progressive expansion
      const p = scrollProgress * 100;
      maskStyle = {
        clipPath: `polygon(0% 0%, 100% 0%, 100% ${Math.min(100, p + 8)}%, 0% ${Math.min(100, p)}%)`,
        WebkitClipPath: `polygon(0% 0%, 100% 0%, 100% ${Math.min(100, p + 8)}%, 0% ${Math.min(100, p)}%)`,
      };
    } else if (variant === 'diagonal-fluid') {
      // Diagonal fluid mask
      const p = scrollProgress * 100;
      maskStyle = {
        clipPath: `polygon(0% 0%, 100% 0%, 100% ${Math.min(100, p)}%, 0% ${Math.min(100, p + 12)}%)`,
        WebkitClipPath: `polygon(0% 0%, 100% 0%, 100% ${Math.min(100, p)}%, 0% ${Math.min(100, p + 12)}%)`,
      };
    }
  }

  const parallaxTransform = !reducedMotion
    ? `translateY(${(1 - scrollProgress) * 28}px)`
    : 'none';

  return (
    <div
      ref={containerRef}
      id={id}
      className={`curtain-reveal-container theme-${theme} variant-${variant} ${inView ? 'is-in-view' : ''} ${className}`}
      style={maskStyle}
    >
      {/* Layered Decorative Backdrop Shade for Curtain Depth */}
      <div
        className="curtain-depth-layer"
        style={{
          opacity: reducedMotion ? 1 : 0.4 + scrollProgress * 0.6,
          transform: !reducedMotion ? `translateY(${(1 - scrollProgress) * 14}px)` : 'none',
        }}
        aria-hidden="true"
      />

      {/* Main Content with subtle foreground parallax */}
      <div
        className="curtain-content-wrapper"
        style={{
          transform: parallaxTransform,
          opacity: reducedMotion ? 1 : 0.2 + scrollProgress * 0.8,
        }}
      >
        {children}
      </div>
    </div>
  );
}
