import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiBarChart2,
  FiCheck,
  FiChevronDown,
  FiFileText,
  FiLayers,
  FiMenu,
  FiPieChart,
  FiShield,
  FiTrendingUp,
  FiX,
  FiZap,
} from 'react-icons/fi';
import './landing.css';

const features = [
  {
    icon: FiFileText,
    number: '01',
    title: 'Intelligent invoice processing',
    text: 'OCR helps extract key information from uploaded invoices and supports the downstream transaction workflow.',
    visual: 'invoice',
  },
  {
    icon: FiLayers,
    number: '02',
    title: 'Smart transaction categorization',
    text: 'Semantic embeddings and machine learning help organize transactions into useful financial categories.',
    visual: 'categories',
  },
  {
    icon: FiZap,
    number: '03',
    title: 'Explainable AI',
    text: 'SHAP-based explanations help make the factors behind a transaction classification easier to understand.',
    visual: 'explanation',
  },
  {
    icon: FiShield,
    number: '04',
    title: 'Financial anomaly detection',
    text: 'Unusual transaction patterns are surfaced for review, with context to help teams investigate.',
    visual: 'anomaly',
  },
  {
    icon: FiTrendingUp,
    number: '05',
    title: 'Cash-flow forecasting',
    text: 'Explore potential financial trends with forecasts based on historical data.',
    visual: 'forecast',
  },
  {
    icon: FiPieChart,
    number: '06',
    title: 'Financial intelligence dashboard',
    text: 'Bring financial KPIs, category-level spending, anomaly summaries, and forecasts into one view.',
    visual: 'dashboard',
  },
];

const technologies = [
  ['React', 'Frontend'],
  ['ASP.NET Core 8', 'Backend API'],
  ['PostgreSQL', 'Relational database'],
  ['Python + FastAPI', 'Internal AI service'],
  ['PaddleOCR', 'Invoice text extraction'],
  ['Sentence embeddings + XGBoost', 'Transaction classification'],
  ['SHAP', 'Model explanations'],
  ['Isolation Forest', 'Anomaly detection'],
  ['Prophet', 'Financial forecasting'],
];

const faqs = [
  {
    question: 'What is IFADSS?',
    answer: 'IFADSS is an intelligent financial automation and decision-support platform for invoice processing, transaction analysis, anomaly review, and forecasting.',
  },
  {
    question: 'Who is IFADSS designed for?',
    answer: 'It is designed for small and medium-sized businesses, accountants, freelancers, and finance teams that need a clearer view of their financial activity.',
  },
  {
    question: 'How does invoice processing work?',
    answer: 'Users upload supported invoices in the application. OCR helps extract relevant document information for the transaction-processing workflow.',
  },
  {
    question: 'How does the system identify unusual transactions?',
    answer: 'Anomaly detection looks for patterns that differ from historical activity and surfaces them for human review. A flag is an indication to investigate, not a conclusion of fraud.',
  },
  {
    question: 'What makes the AI explainable?',
    answer: 'SHAP-based explanations can show factors contributing to a transaction classification, helping users understand how a prediction was reached.',
  },
  {
    question: 'Does IFADSS provide financial forecasts?',
    answer: 'Yes. Forecasting based on historical data helps visualize potential financial trends. Forecasts are estimates, not guaranteed outcomes.',
  },
  {
    question: 'How can I access the application?',
    answer: 'Use Get Started to register or Log In to open an existing account.',
  },
];

function Brand({ footer = false }) {
  return (
    <a className={`landing-brand${footer ? ' landing-brand--footer' : ''}`} href="#home" aria-label="IFADSS home">
      <span className="landing-brand__mark" aria-hidden="true">
        <FiBarChart2 />
      </span>
      <span className="landing-brand__name">IFADSS</span>
    </a>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const links = [
    ['Home', '#home'],
    ['Features', '#features'],
    ['How it works', '#workflow'],
    ['Technology', '#technology'],
    ['About', '#audience'],
  ];

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 12);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  return (
    <header className={`landing-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="landing-container landing-header__inner">
        <Brand />
        <button
          className="landing-menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="landing-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
        <nav
          className={`landing-navigation${menuOpen ? ' is-open' : ''}`}
          id="landing-navigation"
          aria-label="Main navigation"
        >
          <div className="landing-navigation__links">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={closeMenu}>{label}</a>
            ))}
          </div>
          <div className="landing-navigation__actions">
            <Link className="landing-login-link" to="/login" onClick={closeMenu}>Log in</Link>
            <Link className="landing-button landing-button--small" to="/register" onClick={closeMenu}>
              Get started <FiArrowRight aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

function IntelligenceScene() {
  const tiltScene = (event) => {
    if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    event.currentTarget.style.setProperty('--scene-rotate-x', `${-y * 9}deg`);
    event.currentTarget.style.setProperty('--scene-rotate-y', `${x * 10}deg`);
  };

  const resetScene = (event) => {
    event.currentTarget.style.setProperty('--scene-rotate-x', '0deg');
    event.currentTarget.style.setProperty('--scene-rotate-y', '0deg');
  };

  return (
    <div
      className="intelligence-scene"
      onPointerMove={tiltScene}
      onPointerLeave={resetScene}
      role="img"
      aria-label="Illustrative three-dimensional financial intelligence visualization, with invoice, analytics, and transaction signals orbiting an AI core"
    >
      <div className="scene-orbit scene-orbit--outer"><i /><i /></div>
      <div className="scene-orbit scene-orbit--middle"><i /><i /></div>
      <div className="scene-orbit scene-orbit--inner" />
      <div className="scene-core">
        <span className="scene-core__halo" />
        <span className="scene-core__symbol"><FiZap aria-hidden="true" /></span>
        <span className="scene-core__label">FINANCIAL<br />INTELLIGENCE</span>
      </div>
      <div className="scene-float scene-float--invoice">
        <span className="scene-float__icon"><FiFileText aria-hidden="true" /></span>
        <span><small>DOCUMENTS</small><strong>Invoice data</strong></span>
        <i className="scene-float__status" />
      </div>
      <div className="scene-float scene-float--analysis">
        <span className="scene-float__icon"><FiTrendingUp aria-hidden="true" /></span>
        <span><small>ANALYSIS</small><strong>Cash-flow trends</strong></span>
        <span className="scene-sparkline" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
      </div>
      <div className="scene-float scene-float--category">
        <span className="scene-float__icon"><FiLayers aria-hidden="true" /></span>
        <span><small>TRANSACTION</small><strong>Category insight</strong></span>
        <FiArrowRight className="scene-float__arrow" aria-hidden="true" />
      </div>
      <span className="scene-data-point scene-data-point--one" />
      <span className="scene-data-point scene-data-point--two" />
      <span className="scene-data-point scene-data-point--three" />
      <span className="scene-caption">A connected view of financial activity · illustrative</span>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, centered = false }) {
  return (
    <div className={`landing-section-heading${centered ? ' landing-section-heading--center' : ''}`}>
      <span className="landing-eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}

function FeatureVisual({ type }) {
  if (type === 'invoice') {
    return <div className="feature-visual invoice-visual"><span className="invoice-sheet"><i /><i /><i /><i /><b>INVOICE</b></span><span className="visual-arrow"><FiArrowRight /></span><span className="invoice-fields"><i>Vendor</i><b>Northstar Office</b><i>Amount</i><b>$1,240.00</b></span></div>;
  }
  if (type === 'categories') {
    return <div className="feature-visual category-visual"><div><span className="category-dot category-dot--green" />Cloud hosting <b>Technology</b></div><div><span className="category-dot category-dot--gold" />Team lunch <b>Meals</b></div><div><span className="category-dot category-dot--slate" />Office chair <b>Office</b></div></div>;
  }
  if (type === 'explanation') {
    return <div className="feature-visual explanation-visual"><strong>Why this category?</strong><span>Vendor description <i><b style={{ width: '78%' }} /></i></span><span>Similar transactions <i><b style={{ width: '62%' }} /></i></span><span>Amount pattern <i><b style={{ width: '43%' }} /></i></span></div>;
  }
  if (type === 'anomaly') {
    return <div className="feature-visual anomaly-visual"><span className="anomaly-icon"><FiShield /></span><span><strong>Review transaction</strong><small>Amount differs from recent pattern</small></span><span className="anomaly-pill">For review</span></div>;
  }
  if (type === 'forecast') {
    return <div className="feature-visual mini-forecast"><span className="mini-forecast__band" /><svg viewBox="0 0 270 70" preserveAspectRatio="none" aria-hidden="true"><path d="M2 60 C30 44 48 52 74 36 S114 48 142 25 S180 42 203 20" /><path d="M203 20 C223 17 236 31 268 9" /></svg><small>Historical data <i /> Forecast</small></div>;
  }
  return <div className="feature-visual dashboard-visual"><span className="dashboard-visual__sidebar" /><span className="dashboard-visual__content"><i /><i /><i /><b /></span></div>;
}

function ProblemSection() {
  const challenges = [
    ['Manual data entry', 'Invoice information can take repetitive effort to capture and organize.'],
    ['Limited visibility', 'Unusual transactions can be difficult to spot during manual review.'],
    ['Reactive decisions', 'Historical reports may not make possible future cash-flow patterns easy to see.'],
  ];
  return (
    <section className="landing-section problem-section" id="about">
      <div className="landing-container">
        <div className="problem-layout">
          <SectionHeading
            eyebrow="A clearer way forward"
            title="Financial management should be more than manual bookkeeping."
            description="IFADSS brings document processing and financial analysis together to help teams move from scattered information to more useful context."
          />
          <div className="challenge-list">
            {challenges.map(([title, text], index) => (
              <article className="challenge-item" key={title}>
                <span className="challenge-number">0{index + 1}</span>
                <div><h3>{title}</h3><p>{text}</p></div>
                <FiArrowRight aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
        <div className="solution-strip"><span className="solution-strip__icon"><FiZap aria-hidden="true" /></span><p><strong>One connected workflow.</strong> Digitize invoices, organize transactions, review unusual activity, and explore forecasts from a unified financial view.</p><a href="#features">Explore the platform <FiArrowRight aria-hidden="true" /></a></div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section className="landing-section features-section" id="features">
      <div className="landing-container">
        <SectionHeading
          eyebrow="The platform"
          title="Everything you need to understand your finances."
          description="Purposeful tools bring practical AI capabilities into the financial workflows your team already knows."
          centered
        />
        <div className="feature-grid">
          {features.map(({ icon: Icon, number, title, text, visual }) => (
            <article
              className="feature-card"
              key={number}
              onPointerMove={(event) => {
                if (event.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                const x = (event.clientX - bounds.left) / bounds.width - 0.5;
                const y = (event.clientY - bounds.top) / bounds.height - 0.5;
                event.currentTarget.style.setProperty('--card-rotate-x', `${-y * 5}deg`);
                event.currentTarget.style.setProperty('--card-rotate-y', `${x * 5}deg`);
              }}
              onPointerLeave={(event) => {
                event.currentTarget.style.setProperty('--card-rotate-x', '0deg');
                event.currentTarget.style.setProperty('--card-rotate-y', '0deg');
              }}
            >
              <div className="feature-card__top"><span className="feature-card__icon"><Icon aria-hidden="true" /></span><span className="feature-card__number">{number}</span></div>
              <h3>{title}</h3><p>{text}</p>
              <FeatureVisual type={visual} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  const [activeStep, setActiveStep] = useState(0);
  const workflowSteps = [
    ['01', 'Upload documents', 'Upload a supported invoice through the authenticated application.', FiFileText],
    ['02', 'Extract information', 'OCR extracts relevant invoice information for the transaction workflow.', FiLayers],
    ['03', 'Analyze with AI/ML', 'Categorization and explainable insights help organize transaction records.', FiZap],
    ['04', 'Review patterns', 'Unusual activity is surfaced with context for human review.', FiShield],
    ['05', 'Explore forecasts', 'Review dashboard insights and historical-data-based forecasts.', FiTrendingUp],
  ];
  const [, activeTitle, activeDescription, ActiveIcon] = workflowSteps[activeStep];

  return (
    <section className="landing-section workflow-section" id="workflow">
      <div className="landing-container">
        <SectionHeading
          eyebrow="How it works"
          title="From financial documents to actionable insights."
          description="A practical flow that keeps people in the loop from upload through review."
          centered
        />
        <div className="workflow-steps" aria-label="IFADSS workflow">
          {workflowSteps.map(([number, title], index) => (
            <button
              className={`workflow-step${activeStep === index ? ' is-active' : ''}`}
              type="button"
              key={number}
              aria-pressed={activeStep === index}
              onClick={() => setActiveStep(index)}
            >
              <span className="workflow-step__number">{number}<i /></span>
              <span className="workflow-step__title">{title}</span>
            </button>
          ))}
        </div>
        <div className="workflow-detail" aria-live="polite">
          <span className="workflow-detail__icon"><ActiveIcon aria-hidden="true" /></span>
          <div><span className="workflow-detail__eyebrow">STEP {workflowSteps[activeStep][0]}</span><h3>{activeTitle}</h3><p>{activeDescription}</p></div>
          <span className="workflow-detail__illustration" aria-hidden="true"><ActiveIcon /></span>
        </div>
      </div>
    </section>
  );
}

function ExplainabilitySection() {
  const scenarios = [
    {
      label: 'Office purchase',
      transaction: 'Northstar Office · $1,240.00',
      category: 'Office Supplies',
      factors: [
        ['Vendor description', 'Mentions office equipment and supplies', '78%'],
        ['Similar purchases', 'Resembles previously categorized purchases', '62%'],
        ['Transaction amount', 'Somewhat above the sample average', '43%'],
      ],
    },
    {
      label: 'Software service',
      transaction: 'Cloudline Services · $860.00',
      category: 'Technology',
      factors: [
        ['Vendor description', 'References a software service', '82%'],
        ['Similar purchases', 'Matches the illustrative technology group', '69%'],
        ['Transaction amount', 'Within the sample range', '38%'],
      ],
    },
    {
      label: 'Unusual amount',
      transaction: 'Sample vendor · $4,800.00',
      category: 'Review suggested',
      factors: [
        ['Amount pattern', 'Higher than the illustrative recent pattern', '85%'],
        ['Transaction timing', 'Outside the common sample interval', '54%'],
        ['Vendor history', 'Limited comparison history in this example', '29%'],
      ],
    },
  ];
  const [activeScenario, setActiveScenario] = useState(0);
  const scenario = scenarios[activeScenario];

  return (
    <section className="landing-section explain-section">
      <div className="landing-container explain-layout">
        <div className="explain-copy">
          <span className="landing-eyebrow">Clarity behind the result</span>
          <h2>AI insights you can actually understand.</h2>
          <p>Financial automation should not be a black box. IFADSS brings model explanations and understandable anomaly reasons closer to the people making financial decisions.</p>
          <ul>
            <li><FiCheck aria-hidden="true" />See factors that contributed to a category prediction.</li>
            <li><FiCheck aria-hidden="true" />Review unusual activity with context.</li>
            <li><FiCheck aria-hidden="true" />Keep people responsible for the final decision.</li>
          </ul>
          <a className="landing-text-link" href="#features">Explore explainable AI <FiArrowRight aria-hidden="true" /></a>
        </div>
        <div className="explain-demo" aria-label="Illustrative explanation and anomaly example">
          <div className="explain-demo__header"><span className="explain-demo__badge"><FiZap aria-hidden="true" /> EXPLANATION PREVIEW</span><span>Illustrative example</span></div>
          <div className="scenario-selector" aria-label="Choose an illustrative scenario">
            {scenarios.map(({ label }, index) => (
              <button
                type="button"
                key={label}
                className={activeScenario === index ? 'is-active' : ''}
                aria-pressed={activeScenario === index}
                onClick={() => setActiveScenario(index)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="explain-demo__category" aria-live="polite">
            <span className="category-mark">{activeScenario === 2 ? <FiShield aria-hidden="true" /> : 'O'}</span>
            <span><small>{scenario.transaction}</small><strong>{scenario.category}</strong></span>
            <span className="explain-demo__status"><FiCheck aria-hidden="true" /> Sample</span>
          </div>
          <div className="contribution-panel">
            <strong>Illustrative contributing factors</strong>
            <p>Example SHAP-style contributions; not live model output or a measured confidence score.</p>
            {scenario.factors.map(([name, detail, width]) => (
              <div className="contribution-row" key={name}>
                <span>{name}<small>{detail}</small></span>
                <i><b style={{ width }} /></i>
              </div>
            ))}
          </div>
          <div className="explain-demo__alert"><span><FiShield aria-hidden="true" /></span><p><strong>{activeScenario === 2 ? 'Anomaly scenario selected' : 'Illustrative example only'}</strong><small>{activeScenario === 2 ? 'An unusual pattern can be surfaced for human review.' : 'Explanations help interpret a prediction; they do not guarantee correctness.'}</small></p><span className="alert-chevron"><FiArrowRight aria-hidden="true" /></span></div>
        </div>
      </div>
    </section>
  );
}

function TechnologySection() {
  return (
    <section className="landing-section technology-section" id="technology">
      <div className="landing-container">
        <div className="technology-heading">
          <SectionHeading
            eyebrow="Under the hood"
            title="Built around a practical AI architecture."
            description="A straightforward view of the technologies behind the platform."
          />
          <span className="technology-note"><FiLayers aria-hidden="true" /> Implementation details, not magic.</span>
        </div>
        <div className="technology-grid">
          {technologies.map(([name, role], index) => <div className="technology-card" key={name}><span className={`technology-card__mark technology-card__mark--${index % 4}`}>{name.split(/[ +]/)[0].slice(0, 2)}</span><span><strong>{name}</strong><small>{role}</small></span></div>)}
        </div>
      </div>
    </section>
  );
}

function AudienceSection() {
  const audiences = [
    ['SMBs', 'Small and medium-sized businesses', 'Make day-to-day financial information easier to review.'],
    ['PRO', 'Accountants and finance professionals', 'Bring organized transaction context into financial workflows.'],
    ['TEAMS', 'Freelancers and small finance teams', 'See relevant financial activity without scattered views.'],
  ];
  const benefits = [
    'Less repetitive invoice data entry',
    'More structured transaction records',
    'Better visibility into unusual activity',
    'More understandable AI-assisted categorization',
    'A clearer view of financial trends',
  ];
  return (
    <section className="landing-section audience-section" id="audience">
      <div className="landing-container">
        <SectionHeading
          eyebrow="Made for the people behind the numbers"
          title="Designed for people who need financial clarity."
          description="Helpful context for teams managing financial activity at every scale."
          centered
        />
        <div className="audience-grid">
          {audiences.map(([tag, title, text]) => <article className="audience-card" key={tag}><span>{tag}</span><h3>{title}</h3><p>{text}</p></article>)}
        </div>
        <div className="benefit-list" aria-label="Intended benefits">
          {benefits.map((benefit) => <span key={benefit}><FiCheck aria-hidden="true" />{benefit}</span>)}
        </div>
        <p className="benefit-note">These are intended benefits, not guaranteed outcomes.</p>
      </div>
    </section>
  );
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <section className="landing-section faq-section" id="faq">
      <div className="landing-container faq-layout">
        <SectionHeading
          eyebrow="FAQs"
          title="A few things you might be wondering."
          description="Clear answers about what IFADSS does and how to get started."
        />
        <div className="faq-list">
          {faqs.map(({ question, answer }, index) => {
            const isOpen = openIndex === index;
            const answerId = `faq-answer-${index}`;
            return (
              <article className={`faq-item${isOpen ? ' is-open' : ''}`} key={question}>
                <h3><button type="button" aria-expanded={isOpen} aria-controls={answerId} onClick={() => setOpenIndex(isOpen ? -1 : index)}>{question}<FiChevronDown aria-hidden="true" /></button></h3>
                <div className="faq-answer" id={answerId} hidden={!isOpen}><p>{answer}</p></div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="landing-footer">
      <div className="landing-container">
        <div className="landing-footer__main">
          <div className="landing-footer__brand"><Brand footer /><p>Intelligent financial automation and decision support for a clearer view of your business.</p></div>
          <div className="landing-footer__links"><div><strong>Explore</strong><a href="#features">Features</a><a href="#workflow">How it works</a><a href="#technology">Technology</a></div><div><strong>Account</strong><Link to="/login">Log in</Link><Link to="/register">Get started</Link></div></div>
          <Link className="landing-button landing-button--footer" to="/register">Get started <FiArrowRight aria-hidden="true" /></Link>
        </div>
        <div className="landing-footer__bottom"><span>© {new Date().getFullYear()} IFADSS. All rights reserved.</span><span>Designed for clearer financial decisions.</span></div>
      </div>
    </footer>
  );
}

function LandingPage() {
  useEffect(() => {
    const root = document.querySelector('.landing-page');
    if (!root || !('IntersectionObserver' in window)) return undefined;

    const revealElements = root.querySelectorAll(
      '.landing-section, .landing-cta, .feature-card, .technology-card, .audience-card',
    );
    root.classList.add('landing-motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      root.classList.remove('landing-motion-ready');
    };
  }, []);

  return (
    <div className="landing-page">
      <Navbar />
      <main>
        <section className="landing-hero" id="home">
          <div className="landing-container landing-hero__layout">
            <div className="landing-hero__copy">
              <span className="landing-eyebrow"><i /> AI-powered financial intelligence</span>
              <h1>Turn financial data into <em>intelligent decisions.</em></h1>
              <p>Automate invoice processing, understand transaction patterns, identify unusual financial activity, and explore cash-flow forecasts — all through one intelligent financial decision-support platform.</p>
              <div className="landing-hero__actions"><a className="landing-button" href="#features">Explore the platform <FiArrowRight aria-hidden="true" /></a><a className="landing-button landing-button--outline" href="#workflow">Discover how it works <FiArrowRight aria-hidden="true" /></a></div>
              <div className="landing-hero__proof"><span className="proof-avatars"><i>F</i><i>A</i><i>B</i></span><span>Designed for small businesses, accountants, and modern finance teams.</span></div>
            </div>
            <IntelligenceScene />
          </div>
          <div className="landing-container hero-trust"><span>FINANCIAL WORKFLOWS, CONNECTED</span><i /><span>DOCUMENTS</span><FiArrowRight /><span>INSIGHTS</span><FiArrowRight /><span>DECISIONS</span></div>
        </section>
        <ProblemSection />
        <FeaturesSection />
        <WorkflowSection />
        <ExplainabilitySection />
        <TechnologySection />
        <AudienceSection />
        <FAQSection />
        <section className="landing-cta">
          <div className="landing-container landing-cta__inner">
            <div><span className="landing-eyebrow">A clearer view starts here</span><h2>Make your financial data more useful.</h2><p>Explore a more intelligent approach to invoice processing, financial analysis, and decision support.</p></div>
            <div className="landing-cta__actions"><Link className="landing-button landing-button--light" to="/register">Get started <FiArrowRight aria-hidden="true" /></Link><Link className="landing-button landing-button--dark-outline" to="/login">Log in</Link></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
