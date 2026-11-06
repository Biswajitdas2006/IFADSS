import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { formatCurrency } from '../../utils/formatCurrency';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function CashFlowChart({
  forecast = [],
  actualTransactions = [],
  metricType = 'CashFlow',
  label = 'Predicted',
}) {
  const today = new Date();
  const actualStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
  const actualDates = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(actualStart.getTime() + index * 24 * 60 * 60 * 1000);
    return date.toISOString().slice(0, 10);
  });
  const chartForecast = forecast.filter((point) => point.date > actualDates[actualDates.length - 1]);
  const actualByDate = new Map();

  actualTransactions.forEach((transaction) => {
    const amount = Number(transaction.amount);
    const value = metricType === 'Revenue'
      ? (amount > 0 ? amount : 0)
      : metricType === 'Expense'
        ? (amount < 0 ? Math.abs(amount) : 0)
        : amount;
    actualByDate.set(
      transaction.transactionDate,
      (actualByDate.get(transaction.transactionDate) ?? 0) + value,
    );
  });

  const labels = [...actualDates, ...chartForecast.map((point) => point.date)];
  const data = {
    labels,
    datasets: [
      {
        label: 'Actual',
        data: [
          ...actualDates.map((date) => actualByDate.get(date) ?? 0),
          ...chartForecast.map(() => null),
        ],
        borderColor: '#77827C',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,
        spanGaps: false,
      },
      {
        label: 'Lower bound',
        data: [
          ...actualDates.map(() => null),
          ...chartForecast.map((point) => point.lowerBound ?? point.predicted),
        ],
        borderColor: 'transparent',
        pointRadius: 0,
        fill: false,
      },
      {
        label: '80% confidence band',
        data: [
          ...actualDates.map(() => null),
          ...chartForecast.map((point) => point.upperBound ?? point.predicted),
        ],
        borderColor: 'transparent',
        backgroundColor: 'rgba(11, 91, 69, 0.12)',
        pointRadius: 0,
        fill: '-1',
      },
      {
        label,
        data: [
          ...actualDates.map(() => null),
          ...chartForecast.map((point) => point.predicted),
        ],
        borderColor: '#0B5B45',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.25,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: {
          filter: (item) => item.text !== 'Lower bound',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y, { maximumFractionDigits: 0 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          maxTicksLimit: 7,
          maxRotation: 0,
          callback: (value, index) => {
            const date = new Date(`${labels[index]}T00:00:00`);
            return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
          },
        },
      },
      y: {
        border: { display: false },
        grid: { color: '#edf0ed' },
        ticks: {
          callback: (value) => formatCurrency(value, { maximumFractionDigits: 0 }),
        },
      },
    },
  };

  return (
    <div className="forecast-chart">
      <Line data={data} options={options} />
    </div>
  );
}
