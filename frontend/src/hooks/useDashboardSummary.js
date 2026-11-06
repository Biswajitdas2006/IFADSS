import { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';

export function useDashboardSummary(from, to) {
  const requestKey = JSON.stringify([from ?? null, to ?? null]);
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: '',
    requestKey: null,
  });

  useEffect(() => {
    let cancelled = false;

    dashboardService
      .getSummary({ from, to })
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: '', requestKey });
      })
      .catch((error) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: error.response?.data?.error?.message || 'Could not load summary',
            requestKey,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [from, to, requestKey]);

  return {
    ...state,
    loading: state.loading || state.requestKey !== requestKey,
  };
}
