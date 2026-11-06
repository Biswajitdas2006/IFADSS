import { useEffect, useRef, useState } from 'react';
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiChevronRight,
  FiFileText,
  FiPause,
  FiPlay,
  FiRepeat,
  FiTrendingUp,
  FiUploadCloud,
} from 'react-icons/fi';

const WORKFLOW_STEPS = [
  {
    number: '01',
    title: 'Invoice Intake',
    shortTitle: 'Intake',
    icon: FiUploadCloud,
    description: 'Add invoices via PDF, JPG, or PNG upload up to 10 MB. Ingestion validates file integrity and prepares the OCR queue.',
    tags: ['PDF, JPG, PNG', 'Up to 10 MB', 'Instant queue'],
    output: 'Raw document buffer & cryptographic checksum',
    latency: '< 400ms ingestion',
  },
  {
    number: '02',
    title: 'Data Extraction',
    shortTitle: 'Extraction',
    icon: FiFileText,
    description: 'Multi-pass OCR identifies invoice reference, counterparty name, tax IDs, invoice date, line items, and grand totals.',
    tags: ['Multi-pass OCR', 'Tax ID validation', 'Line-item parsing'],
    output: 'Structured JSON document payload with 99%+ accuracy',
    latency: 'Sub-second parsing',
  },
  {
    number: '03',
    title: 'Categorization',
    shortTitle: 'Classification',
    icon: FiRepeat,
    description: 'Statistical rules and ML classification assign expenses to chart-of-accounts categories with confidence percentages.',
    tags: ['COA taxonomy', 'Rule + ML engine', 'Confidence scoring'],
    output: 'Categorized transaction records with editable tags',
    latency: '98.2% avg confidence',
  },
  {
    number: '04',
    title: 'Anomaly Review',
    shortTitle: 'Audit',
    icon: FiAlertTriangle,
    description: 'Automated scans compare activity against 90-day baselines, highlighting duplicate charges or unusual amounts for human sign-off.',
    tags: ['90-day baseline', 'Duplicate check', 'Human sign-off'],
    output: 'Review signals flagged for team verification',
    latency: 'Zero auto-verdicts',
  },
  {
    number: '05',
    title: 'Cash-Flow Forecast',
    shortTitle: 'Forecasting',
    icon: FiTrendingUp,
    description: 'Historical inflow and expense velocity feed predictive cash projections across configurable 7, 30, and 90-day horizons.',
    tags: ['7–90 day horizon', 'Confidence bands', 'Scenario models'],
    output: 'Executive cash-flow projections and liquidity trends',
    latency: '±3.8% empirical interval',
  },
];

export default function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef(null);

  // Optional gentle autoplay loop for sequential financial showcase
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleStepClick = (idx) => {
    setIsPlaying(false);
    setActiveStep(idx);
  };

  const current = WORKFLOW_STEPS[activeStep];
  const StepIcon = current.icon;
  const progressPercent = ((activeStep) / (WORKFLOW_STEPS.length - 1)) * 100;

  return (
    <section className="landing-section workflow-section" id="workflow">
      <div className="landing-container">
        {/* Section Header */}
        <div className="landing-section-heading">
          <div className="workflow-heading-row">
            <div>
              <p className="landing-eyebrow">Connected financial workflow</p>
              <h2>Keep the steps close to the work.</h2>
              <p>
                From source files to verifiable ledger activity and executive forecasts in five considered stages.
              </p>
            </div>
            <button
              type="button"
              className={`workflow-play-toggle ${isPlaying ? 'is-playing' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pause automated walkthrough' : 'Play automated walkthrough'}
            >
              {isPlaying ? <FiPause aria-hidden="true" /> : <FiPlay aria-hidden="true" />}
              <span>{isPlaying ? 'Pause Journey' : 'Auto Tour'}</span>
            </button>
          </div>
        </div>

        {/* Stepper Pipeline with Directional Connecting Flow (Animation 11) */}
        <div className="workflow-pipeline-wrapper">
          {/* Animated Connecting Track */}
          <div className="pipeline-track-bar" aria-hidden="true">
            <div
              className="pipeline-fill-beam"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="workflow-stepper" role="tablist" aria-label="Workflow stages">
            {WORKFLOW_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              const isCompleted = activeStep > idx;
              const Icon = step.icon;

              return (
                <button
                  key={step.number}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`stepper-node ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}`}
                  onClick={() => handleStepClick(idx)}
                >
                  <div className="stepper-node-top">
                    <span className="stepper-num">{step.number}</span>
                    <span className="stepper-icon-wrap">
                      <Icon aria-hidden="true" />
                    </span>
                  </div>
                  <strong className="stepper-title">{step.shortTitle}</strong>
                  <span className="stepper-latency">{step.latency}</span>

                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <FiChevronRight className="stepper-directional-arrow" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Stage Detail Showcase with Staggered Entrance */}
        <div className="workflow-detail-card" key={activeStep} aria-live="polite">
          <div className="workflow-detail-left">
            <div className="workflow-stage-eyebrow">
              <span className="stage-num-badge">STAGE {current.number} OF 05</span>
              <span className="stage-system-tag">Continuous Ledger Pipeline</span>
            </div>
            <h3 className="workflow-detail-title">{current.title}</h3>
            <p className="workflow-detail-desc">{current.description}</p>

            <div className="workflow-tags-row">
              {current.tags.map((tag) => (
                <span key={tag} className="workflow-spec-pill">
                  <FiCheckCircle aria-hidden="true" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="workflow-output-box">
              <span className="output-label">Stage Deliverable:</span>
              <span className="output-val">{current.output}</span>
            </div>
          </div>

          <div className="workflow-detail-right">
            <div className="workflow-nav-buttons">
              <button
                type="button"
                className="step-btn step-prev"
                disabled={activeStep === 0}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep((prev) => Math.max(0, prev - 1));
                }}
              >
                Previous Stage
              </button>
              <button
                type="button"
                className="step-btn step-next"
                disabled={activeStep === WORKFLOW_STEPS.length - 1}
                onClick={() => {
                  setIsPlaying(false);
                  setActiveStep((prev) => Math.min(WORKFLOW_STEPS.length - 1, prev + 1));
                }}
              >
                <span>Next Stage</span>
                <FiArrowRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
