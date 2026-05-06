import { useApi } from './useApi';

export const useDiscomOverview = (opts) => useApi('/api/v1/discom/overview', opts);
export const useDiscomSegmentation = (clusters = 3, opts) => useApi(`/api/v1/discom/segmentation?clusters=${clusters}`, opts);
export const useDiscomDemand = (days = 7, opts) => useApi(`/api/v1/discom/demand?days=${days}`, opts);
export const useDiscomConsumers = (page = 1, pageSize = 50, opts) => useApi(`/api/v1/discom/anomalies?page=${page}&page_size=${pageSize}`, opts);
export const useDiscomRevenue = (opts) => useApi('/api/v1/discom/revenue', opts);
