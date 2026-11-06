import AppLayout from '../components/layout/AppLayout';
import ForecastWidget from '../components/dashboard/ForecastWidget';

function PredictionsPage() {
  return (
    <AppLayout>
      <header className="page-header">
        <div>
          <h1>Predictions</h1>
          <p>Explore estimated revenue, expense, or cash flow for the next 7–90 days.</p>
        </div>
      </header>

      <ForecastWidget />
    </AppLayout>
  );
}

export default PredictionsPage;
