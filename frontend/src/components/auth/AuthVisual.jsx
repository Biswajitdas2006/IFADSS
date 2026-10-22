import { FiArrowUpRight, FiBarChart2, FiFileText, FiLayers, FiZap } from 'react-icons/fi';
import './auth.css';

function AuthVisual() {
  return (
    <aside className="auth-visual" aria-label="Financial intelligence illustration">
      <a className="auth-visual__brand" href="/" aria-label="FinFlow home">
        <span className="auth-visual__brand-mark"><FiBarChart2 aria-hidden="true" /></span>
        <span>FinFlow</span>
        <small>by IFADSS</small>
      </a>

      <div className="auth-visual__message">
        <span className="auth-visual__eyebrow"><i /> INTELLIGENCE FOR YOUR FINANCES</span>
        <h2>Your finances,<br />made <em>intelligent.</em></h2>
        <p>Bring invoices, transaction insights, and cash-flow forecasts into a clearer view.</p>
      </div>

      <div className="auth-scene" aria-hidden="true">
        <div className="auth-scene__orbit auth-scene__orbit--one"><i /></div>
        <div className="auth-scene__orbit auth-scene__orbit--two"><i /></div>
        <div className="auth-scene__core"><span><FiZap /></span></div>
        <div className="auth-scene__card auth-scene__card--invoice">
          <span className="auth-scene__icon"><FiFileText /></span>
          <span><small>DOCUMENTS</small><strong>Invoice insights</strong></span>
          <i className="auth-scene__status" />
        </div>
        <div className="auth-scene__card auth-scene__card--trend">
          <span className="auth-scene__icon"><FiBarChart2 /></span>
          <span><small>FINANCIAL PATTERNS</small><strong>Cash-flow trends</strong></span>
          <FiArrowUpRight className="auth-scene__trend-icon" />
        </div>
        <div className="auth-scene__card auth-scene__card--category">
          <span className="auth-scene__icon"><FiLayers /></span>
          <span><small>TRANSACTIONS</small><strong>Organized insights</strong></span>
        </div>
        <i className="auth-scene__particle auth-scene__particle--one" />
        <i className="auth-scene__particle auth-scene__particle--two" />
        <i className="auth-scene__particle auth-scene__particle--three" />
      </div>

      <div className="auth-visual__foot">
        <span>INVOICES</span><i /><span>INSIGHTS</span><i /><span>DECISIONS</span>
      </div>
      <span className="auth-visual__disclaimer">Illustrative visual · not live financial data</span>
    </aside>
  );
}

export default AuthVisual;
