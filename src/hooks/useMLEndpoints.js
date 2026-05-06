import { useApi } from './useApi';

// Consumer ML endpoints
export const useApplianceBreakdown = (days = 30) => useApi(`/api/v1/ml/nilm?days=${days}`);
export const useForecast = (horizon = 7) => useApi(`/api/v1/ml/forecast?horizon=${horizon}`);
export const useAnomalies = (threshold = 2.0) => useApi(`/api/v1/ml/anomalies?threshold=${threshold}`);
export const useTariffOptimizer = () => useApi('/api/v1/ml/tariff-optimizer');
export const useDemandResponse = (hours = 24) => useApi(`/api/v1/ml/demand-response?hours=${hours}`);
export const useRecommendations = () => useApi('/api/v1/ml/recommendations');
export const useMySegmentation = () => useApi('/api/v1/ml/segmentation/me');
