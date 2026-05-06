import { useApi } from './useApi';

export const useGridDemand = (days = 7, opts) => useApi(`/api/v1/grid/demand?days=${days}`, opts);
export const useGridPeakHistory = (days = 30, opts) => useApi(`/api/v1/grid/peak-history?days=${days}`, opts);
export const useGridLoadDistribution = (opts) => useApi('/api/v1/grid/load-distribution', opts);
