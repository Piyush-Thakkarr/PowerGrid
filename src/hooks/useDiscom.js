import { useApi } from './useApi';

export const useDiscomOverview = () => useApi('/api/v1/discom/overview');
export const useDiscomSegmentation = (clusters = 3) => useApi(`/api/v1/discom/segmentation?clusters=${clusters}`);
export const useDiscomDemand = (days = 7) => useApi(`/api/v1/discom/demand?days=${days}`);
export const useDiscomConsumers = (page = 1, pageSize = 50) => useApi(`/api/v1/discom/anomalies?page=${page}&page_size=${pageSize}`);
export const useDiscomRevenue = () => useApi('/api/v1/discom/revenue');
