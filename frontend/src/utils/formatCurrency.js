export function formatCurrency(amount, {
  minimumFractionDigits = 0,
  maximumFractionDigits = 2,
} = {}) {
  const value = Number(amount ?? 0);

  if (!Number.isFinite(value)) return '—';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
}
