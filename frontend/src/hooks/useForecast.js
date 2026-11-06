import { useEffect, useState } from 'react';
import { predictionService } from '../services/predictionService';

export function useForecast(metricType, horizonDays, enabled = true) {
  const requestKey = `${metricType}:${horizonDays}`;
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: '',
    insufficient: false,
    requestKey: null,
  });

  useEffect(() => {
    if (!enabled) return undefined;

    let cancelled = false;

    predictionService
      .getForecast(metricType, horizonDays)
      .then((data) => {
        if (!cancelled) {
          setState({
            data,
            loading: false,
            error: '',
            insufficient: false,
            requestKey,
          });
        }
      })
      .catch((error) => {
        if (cancelled) return;

        const status = error.response?.status;
        setState({
          data: null,
          loading: false,
          insufficient: status === 422,
          error: status === 422
            ? ''
            : error.response?.data?.error?.message || 'Could not load forecast',
          requestKey,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [metricType, horizonDays, enabled, requestKey]);

  return {
    ...state,
    loading: enabled && (state.loading || state.requestKey !== requestKey),
  };
}
