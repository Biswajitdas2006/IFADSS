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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const fmt = (value) =>
  Number(value).toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });

export default function CashFlowChart({ forecast, label = 'Predicted' }) {
  const data = {
    labels: forecast.map((point) => point.date),
    datasets: [
      {
        label: 'Lower bound',
        data: forecast.map((point) => point.lowerBound),
        borderColor: 'transparent',
        pointRadius: 0,
        fill: false,
      },
      {
        label: '80% confidence band',
        data: forecast.map((point) => point.upperBound),
        borderColor: 'transparent',
        backgroundColor: 'rgba(37, 99, 235, 0.18)',
        pointRadius: 0,
        fill: '-1',
      },
      {
        label,
        data: forecast.map((point) => point.predicted),
        borderColor: '#2563eb',
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
          label: (context) => `${context.dataset.label}: ${fmt(context.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { maxTicksLimit: 8 },
      },
      y: {
        ticks: {
          callback: (value) => fmt(value),
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
