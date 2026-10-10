import AppLayout from '../components/layout/AppLayout';
import ForecastWidget from '../components/dashboard/ForecastWidget';
import { theme } from '../styles/theme';

function PredictionsPage() {
  return (
    <AppLayout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Predictions</h1>
          <p style={styles.subheading}>Projected revenue, expense, and cash flow over the next horizon.</p>
        </div>
      </div>

      <ForecastWidget />
    </AppLayout>
  );
}

const styles = {
  header: {
    marginBottom: '24px',
  },
  heading: {
    color: theme.colors.inkBase,
    fontFamily: theme.fonts.display,
    fontSize: '28px',
    margin: 0,
    marginBottom: '6px',
  },
  subheading: {
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.body,
    fontSize: '14px',
    margin: 0,
  },
};

export default PredictionsPage;
