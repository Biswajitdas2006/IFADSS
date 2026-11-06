import { useId } from 'react';

/**
 * NeuralStream — The Roaming Neural Network Backbone
 * Provides living, animated information conduits that visually link
 * sections of the homepage together to communicate continuous intelligence flow.
 */
export default function NeuralStream({
  variant = 'hero-to-product',
  className = '',
}) {
  const streamId = useId().replace(/:/g, '');

  if (variant === 'hero-to-product') {
    return (
      <div className={`neural-stream-conduit stream-hero-to-product ${className}`} aria-hidden="true">
        <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className="neural-conduit-svg">
          <defs>
            <linearGradient id={`stream-grad-1-${streamId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#075b48" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id={`stream-glow-1-${streamId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#075b48" stopOpacity="0.0" />
            </linearGradient>
            <filter id={`stream-blur-${streamId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* Central Conduit from 3D Hero */}
          <path
            d="M 600 0 C 600 60, 600 90, 600 160"
            fill="none"
            stroke={`url(#stream-glow-1-${streamId})`}
            strokeWidth="6"
            filter={`url(#stream-blur-${streamId})`}
          />
          <path
            d="M 600 0 C 600 60, 600 90, 600 160"
            fill="none"
            stroke={`url(#stream-grad-1-${streamId})`}
            strokeWidth="1.8"
            strokeDasharray="5 4"
            className="stream-flowing-dash"
          />

          {/* Branch Left: Inflow Stream */}
          <path
            d="M 600 45 C 500 70, 380 90, 320 160"
            fill="none"
            stroke="#a9cfc1"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
          />
          {/* Branch Right: Reconciliation Stream */}
          <path
            d="M 600 45 C 700 70, 820 90, 880 160"
            fill="none"
            stroke="#a9cfc1"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            strokeOpacity="0.45"
          />

          {/* Traveling Information Pulses */}
          <circle r="4" fill="#34d399" filter={`url(#stream-blur-${streamId})`}>
            <animateMotion
              path="M 600 0 C 600 60, 600 90, 600 160"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="#22d3ee">
            <animateMotion
              path="M 600 45 C 500 70, 380 90, 320 160"
              dur="2.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3" fill="#34d399">
            <animateMotion
              path="M 600 45 C 700 70, 820 90, 880 160"
              dur="2.6s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Central Synapse Hub */}
          <circle cx="600" cy="45" r="5" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
          <circle cx="600" cy="45" r="10" fill="none" stroke="#34d399" strokeWidth="1" className="hub-ripple" />
        </svg>
      </div>
    );
  }

  if (variant === 'product-to-workflow') {
    return (
      <div className={`neural-stream-conduit stream-product-to-workflow ${className}`} aria-hidden="true">
        <svg viewBox="0 0 1200 180" preserveAspectRatio="none" className="neural-conduit-svg">
          <defs>
            <linearGradient id={`stream-grad-2-${streamId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#075b48" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
            </linearGradient>
            <filter id={`stream-blur-2-${streamId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" />
            </filter>
          </defs>

          {/* 3 Converging Input Streams entering the Workflow Environment */}
          <path
            d="M 320 0 C 320 80, 420 110, 480 180"
            fill="none"
            stroke={`url(#stream-grad-2-${streamId})`}
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />
          <path
            d="M 600 0 C 600 70, 600 120, 600 180"
            fill="none"
            stroke={`url(#stream-grad-2-${streamId})`}
            strokeWidth="2.2"
            strokeDasharray="5 3"
          />
          <path
            d="M 880 0 C 880 80, 780 110, 720 180"
            fill="none"
            stroke={`url(#stream-grad-2-${streamId})`}
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />

          {/* Glowing Traveling Pulses */}
          <circle r="4" fill="#34d399" filter={`url(#stream-blur-2-${streamId})`}>
            <animateMotion
              path="M 600 0 C 600 70, 600 120, 600 180"
              dur="2.0s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3.2" fill="#22d3ee">
            <animateMotion
              path="M 320 0 C 320 80, 420 110, 480 180"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3.2" fill="#34d399">
            <animateMotion
              path="M 880 0 C 880 80, 780 110, 720 180"
              dur="2.3s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Terminal Input Ports */}
          <circle cx="480" cy="180" r="4" fill="#34d399" />
          <circle cx="600" cy="180" r="5" fill="#34d399" />
          <circle cx="720" cy="180" r="4" fill="#34d399" />
        </svg>
      </div>
    );
  }

  if (variant === 'workflow-to-capabilities') {
    return (
      <div className={`neural-stream-conduit stream-workflow-to-capabilities ${className}`} aria-hidden="true">
        <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className="neural-conduit-svg">
          <defs>
            <linearGradient id={`stream-grad-3-${streamId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#075b48" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* 5 Structured Channels emerging from Workflow into Capabilities */}
          {[240, 420, 600, 780, 960].map((x, i) => (
            <g key={x}>
              <path
                d={`M ${x} 0 C ${x} 60, ${280 + i * 160} 100, ${280 + i * 160} 160`}
                fill="none"
                stroke={`url(#stream-grad-3-${streamId})`}
                strokeWidth="1.4"
                strokeDasharray="4 4"
                strokeOpacity="0.6"
              />
              <circle r="3" fill={i % 2 === 0 ? '#34d399' : '#22d3ee'}>
                <animateMotion
                  path={`M ${x} 0 C ${x} 60, ${280 + i * 160} 100, ${280 + i * 160} 160`}
                  dur={`${2.2 + i * 0.3}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  if (variant === 'capabilities-to-kpis') {
    return (
      <div className={`neural-stream-conduit stream-capabilities-to-kpis ${className}`} aria-hidden="true">
        <svg viewBox="0 0 1200 160" preserveAspectRatio="none" className="neural-conduit-svg">
          <defs>
            <linearGradient id={`stream-grad-4-${streamId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#075b48" stopOpacity="0.25" />
              <stop offset="60%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#075b48" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Conduits converging directly into the 4 KPI card pillars */}
          {[160, 450, 750, 1040].map((targetX, idx) => (
            <g key={targetX}>
              <path
                d={`M 600 0 C ${400 + idx * 130} 60, ${targetX} 90, ${targetX} 160`}
                fill="none"
                stroke={`url(#stream-grad-4-${streamId})`}
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <circle r="3.5" fill="#10b981">
                <animateMotion
                  path={`M 600 0 C ${400 + idx * 130} 60, ${targetX} 90, ${targetX} 160`}
                  dur={`${2.0 + idx * 0.35}s`}
                  repeatCount="indefinite"
                />
              </circle>
              {/* Destination Port on KPI Card */}
              <circle cx={targetX} cy="160" r="4" fill="#075b48" stroke="#34d399" strokeWidth="1" />
            </g>
          ))}
        </svg>
      </div>
    );
  }

  if (variant === 'governance-to-cta') {
    return (
      <div className={`neural-stream-conduit stream-governance-to-cta ${className}`} aria-hidden="true">
        <svg viewBox="0 0 1200 180" preserveAspectRatio="none" className="neural-conduit-svg">
          <defs>
            <linearGradient id={`stream-grad-5-${streamId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#075b48" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
            </linearGradient>
            <filter id={`stream-blur-5-${streamId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* All channels converging into the central CTA focal point */}
          <path
            d="M 200 0 C 350 80, 500 120, 600 180"
            fill="none"
            stroke={`url(#stream-grad-5-${streamId})`}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <path
            d="M 600 0 C 600 60, 600 120, 600 180"
            fill="none"
            stroke={`url(#stream-grad-5-${streamId})`}
            strokeWidth="2.4"
            strokeDasharray="5 3"
          />
          <path
            d="M 1000 0 C 850 80, 700 120, 600 180"
            fill="none"
            stroke={`url(#stream-grad-5-${streamId})`}
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />

          {/* Converging Information Signals */}
          <circle r="4" fill="#34d399" filter={`url(#stream-blur-5-${streamId})`}>
            <animateMotion
              path="M 600 0 C 600 60, 600 120, 600 180"
              dur="1.8s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3.2" fill="#22d3ee">
            <animateMotion
              path="M 200 0 C 350 80, 500 120, 600 180"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
          <circle r="3.2" fill="#34d399">
            <animateMotion
              path="M 1000 0 C 850 80, 700 120, 600 180"
              dur="2.2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Converged Focal Nexus */}
          <circle cx="600" cy="180" r="6" fill="#34d399" stroke="#fff" strokeWidth="2" />
        </svg>
      </div>
    );
  }

  return null;
}

