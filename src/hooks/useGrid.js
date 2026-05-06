import { useApi } from './useApi';

export const useGridDemand = (days = 7) => useApi(`/api/v1/grid/demand?days=${days}`);
export const useGridPeakHistory = (days = 30) => useApi(`/api/v1/grid/peak-history?days=${days}`);
export const useGridLoadDistribution = () => useApi('/api/v1/grid/load-distribution');
