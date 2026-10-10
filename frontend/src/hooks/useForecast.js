import { useEffect, useState } from 'react';
import { predictionService } from '../services/predictionService';

export function useForecast(metricType, horizonDays, enabled = true) {
  const [state, setState] = useState({
    data: null,
    loading: enabled,
    error: '',
    insufficient: false,
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    setState((current) => ({
      ...current,
      loading: true,
      error: '',
      insufficient: false,
    }));

    predictionService
      .getForecast(metricType, horizonDays)
      .then((data) => {
        if (!cancelled) {
          setState({ data, loading: false, error: '', insufficient: false });
        }
      })
      .catch((error) => {
        if (cancelled) return;

        const status = error.response?.status;
        setState({
          data: null,
          loading: false,
          insufficient: status === 422,
          error: status === 422 ? '' : error.response?.data?.error?.message || 'Could not load forecast',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [metricType, horizonDays, enabled]);

  return state;
}
