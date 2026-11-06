import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiFileText,
  FiLayers,
  FiMaximize2,
  FiRepeat,
  FiTrendingUp,
  FiX,
} from 'react-icons/fi';
import HeadMesh, { INTERACTION_ZONES } from './HeadMesh';
import './intelligence-experience.css';

// Rich contextual document payloads for all 4 capability zones
const DOCUMENT_DATA = {
  invoice: {
    zoneLabel: 'ZONE 01 · FOREHEAD',
    capability: 'Invoice Intelligence',
    icon: FiFileText,
    badge: 'Verified Extraction',
    badgeVariant: 'success',
    documentType: 'Commercial Invoice',
    docId: 'INV-2026-0842',
    vendor: 'Apex Logistics & Freight Corp',
    date: 'Oct 24, 2026',
    amount: '$14,850.00',
    meta: [
      { label: 'File Type', value: 'PDF (Vector, 3 pages)' },
      { label: 'OCR Confidence', value: '99.4% (Multi-pass)' },
      { label: 'Line Items', value: '3 freight manifests matched' },
      { label: 'Tax ID Match', value: 'US-EIN verified' },
    ],
    highlight: 'Auto-reconciled against Purchase Order #PO-9912',
    status: 'Ready for one-click ledger sync',
  },
  transactions: {
    zoneLabel: 'ZONE 02 · TEMPLE',
    capability: 'Transaction Intelligence',
    icon: FiRepeat,
    badge: 'Automated Classification',
    badgeVariant: 'info',
    documentType: 'Bank Transaction Record',
    docId: 'TXN-9021-CLD',
    vendor: 'CloudScale Infrastructure Ltd',
    date: 'Oct 25, 2026',
    amount: '$2,420.00',
    meta: [
      { label: 'Suggested Category', value: 'IT & Cloud Infrastructure' },
      { label: 'Model Confidence', value: '98.2% historical match' },
      { label: 'Rule Association', value: 'Monthly Recurring SaaS' },
      { label: 'User Control', value: 'Editable at any time' },
    ],
    highlight: 'Identified as recurring compute cost with 100% historical consistency',
    status: 'Category suggested · Team retains final edit authority',
  },
  anomalies: {
    zoneLabel: 'ZONE 03 · OCCIPITAL',
    capability: 'Anomaly Detection',
    icon: FiAlertTriangle,
    badge: 'Review Signal Detected',
    badgeVariant: 'warning',
    documentType: 'Flagged Activity Audit',
    docId: 'ANM-4402-DUP',
    vendor: 'Acme Industrial Supply',
    date: 'Oct 25, 2026',
    amount: '$8,750.00',
    meta: [
      { label: 'Variance Score', value: '88% deviation index' },
      { label: 'Signal Reason', value: 'Duplicate amount within 48h' },
      { label: 'Historical Baseline', value: 'Avg $3,200.00/mo' },
      { label: 'Governance Rule', value: 'Human sign-off required' },
    ],
    highlight: 'Flagged as potential duplicate invoice before payment processing',
    status: 'Decision signal only — not an automated fraud verdict',
  },
  forecast: {
    zoneLabel: 'ZONE 04 · MANDIBLE',
    capability: 'Cash-Flow Forecasting',
    icon: FiTrendingUp,
    badge: '30-Day Outlook',
    badgeVariant: 'success',
    documentType: 'Predictive Cash-Flow Model',
    docId: 'FCST-2026-Q4',
    vendor: 'Aggregate Operating Accounts',
    date: 'Horizon: 30 Days (Rolling)',
    amount: '+$55,800.00 Net',
    meta: [
      { label: 'Projected Inflow', value: '$148,200.00' },
      { label: 'Projected Outflow', value: '$92,400.00' },
      { label: 'Confidence Band', value: '±3.8% empirical variance' },
      { label: 'Data Basis', value: '12-month historical transactions' },
    ],
    highlight: 'Projected cash reserve remains healthy across the 90-day horizon',
    status: 'Estimates based on active history — not guarantees',
  },
};

function WebGLFallback({ selectedZone, onSelect }) {
  return (
    <div className="intelligence-fallback-wrapper">
      <div className="intelligence-fallback-graphic">
        <svg viewBox="0 0 280 340" className="fallback-head-svg" aria-label="Sculptural intelligence head illustration">
          <defs>
            <linearGradient id="fallback-sculpture" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#16856b" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#075b48" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#04231c" stopOpacity="0.95" />
            </linearGradient>
            <radialGradient id="fallback-glow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#075b48" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Cranial outline */}
          <path
            d="M 140 30 C 85 30, 50 70, 50 135 C 50 185, 75 220, 105 250 L 115 295 L 165 295 L 175 250 C 205 220, 230 185, 230 135 C 230 70, 195 30, 140 30 Z"
            fill="url(#fallback-sculpture)"
            stroke="#34d399"
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />

          {/* Internal cranial glow */}
          <circle cx="140" cy="120" r="65" fill="url(#fallback-glow)" />

          {/* Neural lines */}
          <path d="M 140 120 L 140 70 M 140 120 L 195 105 M 140 120 L 80 130 M 140 120 L 165 220" stroke="#6ee7b7" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.8" />

          {/* Facial structure contours */}
          <path d="M 140 105 L 140 160 L 152 175 L 135 178" fill="none" stroke="#a9cfc1" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
          <path d="M 120 130 C 130 125, 150 125, 160 130" fill="none" stroke="#a9cfc1" strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
          <path d="M 125 210 C 135 218, 145 218, 155 210" fill="none" stroke="#a9cfc1" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>

        {/* Interactive hotspot dots for fallback mode */}
        {INTERACTION_ZONES.map((zone) => (
          <button
            key={zone.id}
            type="button"
            className={`fallback-hotspot-btn zone-${zone.id} ${selectedZone === zone.id ? 'is-active' : ''}`}
            onClick={() => onSelect(selectedZone === zone.id ? null : zone.id)}
            aria-label={`Explore ${zone.label}`}
          >
            <span className="hotspot-pulse" />
            <span className="hotspot-dot" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function IntelligenceExperience() {
  const [selectedZone, setSelectedZone] = useState('invoice'); // Default to Zone 01 on first load to showcase rich document emergence
  const [hoveredZone, setHoveredZone] = useState(null);
  const [isRetracting, setIsRetracting] = useState(false);
  const [pointerInside, setPointerInside] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [screenCoords, setScreenCoords] = useState({});
  const stageRef = useRef(null);
  const switchTimeoutRef = useRef(null);

  // Check reduced motion preference
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Keyboard accessibility: Escape closes open document
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cleanup pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }
    };
  }, []);

  // Callback to receive projected 3D screen coordinates from HeadMesh in real-time
  const handleUpdateScreenPos = useCallback((zoneId, pos) => {
    setScreenCoords((prev) => {
      if (prev[zoneId]?.x === pos.x && prev[zoneId]?.y === pos.y) return prev;
      return { ...prev, [zoneId]: pos };
    });
  }, []);

  // Smooth document switching and retraction (Animation 09 — Document Transitions)
  const handleSelectZone = useCallback((zoneId) => {
    if (switchTimeoutRef.current) {
      clearTimeout(switchTimeoutRef.current);
      switchTimeoutRef.current = null;
    }

    // If clicking active zone, smoothly retract and dismiss
    if (selectedZone === zoneId) {
      setIsRetracting(true);
      switchTimeoutRef.current = setTimeout(() => {
        setSelectedZone(null);
        setIsRetracting(false);
      }, 220);
      return;
    }

    // If switching from one zone to another, play retraction then emergence
    if (selectedZone && selectedZone !== zoneId) {
      setIsRetracting(true);
      switchTimeoutRef.current = setTimeout(() => {
        setSelectedZone(zoneId);
        setIsRetracting(false);
      }, 190);
      return;
    }

    // Opening from idle state
    setSelectedZone(zoneId);
    setIsRetracting(false);
  }, [selectedZone]);

  const handleDismiss = useCallback(() => {
    if (!selectedZone) return;
    setIsRetracting(true);
    if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current);
    switchTimeoutRef.current = setTimeout(() => {
      setSelectedZone(null);
      setIsRetracting(false);
    }, 220);
  }, [selectedZone]);

  const activeDoc = selectedZone ? DOCUMENT_DATA[selectedZone] : null;
  const activeCoord = selectedZone ? screenCoords[selectedZone] : null;

  // Compute smooth cubic bezier connection line from 3D hotspot to document card
  let linePath = '';
  let lineTarget = { x: 0, y: 0 };
  if (activeCoord && stageRef.current) {
    const stageRect = stageRef.current.getBoundingClientRect();
    const startX = Math.max(10, Math.min(stageRect.width - 10, activeCoord.x));
    const startY = Math.max(10, Math.min(stageRect.height - 10, activeCoord.y));

    // Target anchor on document preview card (left edge of card on desktop)
    const isMobile = window.innerWidth <= 840;
    const targetX = isMobile ? stageRect.width * 0.5 : stageRect.width - 342;
    const targetY = isMobile ? stageRect.height - 180 : stageRect.height * 0.5;
    lineTarget = { x: targetX, y: targetY };

    const dx = targetX - startX;
    const cp1x = startX + dx * 0.45;
    const cp1y = startY;
    const cp2x = startX + dx * 0.55;
    const cp2y = targetY;

    linePath = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${targetX.toFixed(1)} ${targetY.toFixed(1)}`;
  }

  return (
    <section className="intelligence-experience" aria-label="Interactive 3D Financial Intelligence Core">
      <div
        ref={stageRef}
        className="intelligence-stage"
        onMouseEnter={() => setPointerInside(true)}
        onMouseLeave={() => setPointerInside(false)}
      >
        {/* Stage Status Badges */}
        <div className="stage-header-badges">
          <div className="stage-status-pill">
            <span className="live-pulse-dot" aria-hidden="true" />
            <span className="stage-status-text">INTELLIGENCE IN MOTION 2.0</span>
          </div>
          <div className="stage-hint-pill">
            <FiMaximize2 aria-hidden="true" />
            <span>Interactive Neural Model</span>
          </div>
        </div>

        {/* 3D WebGL Canvas */}
        <div
          className="intelligence-canvas-container"
          role="region"
          aria-label="Interactive 3D human head with neural financial structures"
        >
          <Canvas
            camera={{ position: [0, 0, 4.4], fov: 36 }}
            dpr={[1, 1.8]}
            gl={{
              alpha: true,
              antialias: true,
              powerPreference: 'high-performance',
            }}
            frameloop={reducedMotion ? 'demand' : 'always'}
            fallback={<WebGLFallback selectedZone={selectedZone} onSelect={handleSelectZone} />}
          >
            {/* Cinematic Lighting System */}
            <ambientLight intensity={1.2} />
            {/* Key directional light */}
            <directionalLight position={[4, 5, 5]} intensity={2.8} color="#f0fdf4" />
            {/* Deep emerald rim light from behind */}
            <directionalLight position={[-4, 2, -3]} intensity={4.2} color="#10b981" />
            {/* Restrained cyan accent light for technological depth */}
            <pointLight position={[3, -2, 2]} intensity={6} color="#06b6d4" distance={8} />
            {/* Soft upward fill */}
            <pointLight position={[0, -4, 3]} intensity={3} color="#075b48" distance={6} />

            <Suspense fallback={null}>
              <HeadMesh
                selectedZone={selectedZone}
                hoveredZone={hoveredZone}
                onHover={setHoveredZone}
                onUnhover={() => setHoveredZone(null)}
                onSelect={handleSelectZone}
                onUpdateScreenPos={handleUpdateScreenPos}
                motionEnabled={!reducedMotion}
                pointerInside={pointerInside}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Dynamic Real-Time Connecting Line & Traveling Signal (Animations 05 & 07) */}
        {selectedZone && linePath && (
          <svg className={`intelligence-connector-svg ${isRetracting ? 'is-retracting' : ''}`} aria-hidden="true">
            <defs>
              <linearGradient id="connector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#34d399" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.95" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Glowing outer blur line */}
            <path d={linePath} fill="none" stroke="#22d3ee" strokeWidth="2.8" opacity="0.3" filter="url(#glow)" />
            {/* Crisp dashed technical line */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#connector-gradient)"
              strokeWidth="1.6"
              strokeDasharray="4 3"
              className="animated-flow-line"
            />

            {/* Traveling Light Signal Pulse along the curve (Animation 07) */}
            <circle r="4.5" fill="#34d399" filter="url(#glow)">
              <animateMotion
                path={linePath}
                dur="1.6s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Origin indicator dot anchored to 3D hotspot */}
            {activeCoord && (
              <circle
                cx={activeCoord.x}
                cy={activeCoord.y}
                r="4.2"
                fill="#22d3ee"
                stroke="#fff"
                strokeWidth="1.5"
              />
            )}

            {/* Terminus anchor & arrival pulse at document card (Animation 07) */}
            {lineTarget.x > 0 && (
              <g>
                <circle
                  cx={lineTarget.x}
                  cy={lineTarget.y}
                  r="6"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="1.2"
                  className="card-arrival-pulse"
                />
                <circle
                  cx={lineTarget.x}
                  cy={lineTarget.y}
                  r="3.5"
                  fill="#10b981"
                  stroke="#fff"
                  strokeWidth="1.2"
                />
              </g>
            )}
          </svg>
        )}

        {/* Contextual Emerging Document Preview Card (Animations 05, 06, 09) */}
        {activeDoc && (
          <aside
            className={`emerging-document-card ${isRetracting ? 'is-retracting' : ''}`}
            role="dialog"
            aria-label={`${activeDoc.capability} Document Preview`}
          >
            <div className="card-top-bar">
              <div className="card-eyebrow-group">
                <span className="card-zone-label">{activeDoc.zoneLabel}</span>
                <span className={`card-badge badge-${activeDoc.badgeVariant}`}>
                  <FiCheckCircle aria-hidden="true" />
                  {activeDoc.badge}
                </span>
              </div>
              <button
                type="button"
                className="card-close-btn"
                onClick={handleDismiss}
                aria-label="Close document preview"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <div className="card-title-group">
              <span className="card-icon-wrap">
                <activeDoc.icon aria-hidden="true" />
              </span>
              <div>
                <h3 className="card-main-title">{activeDoc.capability}</h3>
                <p className="card-doc-type">{activeDoc.documentType} · #{activeDoc.docId}</p>
              </div>
            </div>

            {/* Primary Document Summary */}
            <div className="card-hero-metric">
              <div className="metric-primary-col">
                <span className="metric-caption">Transaction Amount</span>
                <strong className="metric-amount">{activeDoc.amount}</strong>
              </div>
              <div className="metric-secondary-col">
                <span className="metric-caption">Counterparty / Vendor</span>
                <span className="metric-vendor">{activeDoc.vendor}</span>
              </div>
            </div>

            {/* Structured Metadata Breakdown */}
            <dl className="card-metadata-grid">
              {activeDoc.meta.map(({ label, value }) => (
                <div key={label} className="meta-row">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>

            {/* Contextual Highlight Banner */}
            <div className="card-highlight-banner">
              <span className="highlight-dot" aria-hidden="true" />
              <p>{activeDoc.highlight}</p>
            </div>

            {/* Governance & Status Footer */}
            <div className="card-status-footer">
              <FiCheck className="status-check-icon" aria-hidden="true" />
              <span>{activeDoc.status}</span>
            </div>
          </aside>
        )}

        {/* Idle Prompt Helper when no zone is active */}
        {!selectedZone && (
          <div className="stage-idle-instruction">
            <span className="idle-radar-ping" aria-hidden="true" />
            <span>Select a neural hotspot on the 3D model to explore live financial documents</span>
          </div>
        )}
      </div>

      {/* Interactive Hotspot Control Bar */}
      <div className="stage-controls-nav" role="tablist" aria-label="Interactive intelligence zones">
        {INTERACTION_ZONES.map((zone, idx) => {
          const isSelected = selectedZone === zone.id;
          return (
            <button
              key={zone.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`zone-nav-pill ${isSelected ? 'is-active' : ''}`}
              onClick={() => handleSelectZone(zone.id)}
            >
              <span className="zone-pill-number">0{idx + 1}</span>
              <span className="zone-pill-label">{zone.label}</span>
              <FiArrowRight className="zone-pill-arrow" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      {/* Verified Transparency Statement */}
      <p className="stage-transparency-note">
        Illustrative document schemas demonstrate real workspace capabilities. Active workspace figures are generated strictly from your uploaded files and transaction accounts.
      </p>
    </section>
  );
}
