import { useApi } from './useApi';

// Consumer ML endpoints. Each accepts an optional `{ skip }` so callers
// (e.g. DashboardPreview using mock data) can suppress the network request.
export const useApplianceBreakdown = (days = 30, opts) => useApi(`/api/v1/ml/nilm?days=${days}`, opts);
export const useForecast = (horizon = 7, opts) => useApi(`/api/v1/ml/forecast?horizon=${horizon}`, opts);
export const useAnomalies = (threshold = 2.0, opts) => useApi(`/api/v1/ml/anomalies?threshold=${threshold}`, opts);
export const useTariffOptimizer = (opts) => useApi('/api/v1/ml/tariff-optimizer', opts);
export const useDemandResponse = (hours = 24, opts) => useApi(`/api/v1/ml/demand-response?hours=${hours}`, opts);
export const useRecommendations = (opts) => useApi('/api/v1/ml/recommendations', opts);
export const useMySegmentation = (opts) => useApi('/api/v1/ml/segmentation/me', opts);
