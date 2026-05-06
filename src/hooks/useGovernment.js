import { useApi } from './useApi';

export const useGovOverview = (opts) => useApi('/api/v1/government/overview', opts);
export const useGovSegmentation = (clusters = 3, opts) => useApi(`/api/v1/government/segmentation?clusters=${clusters}`, opts);
export const useGovTariffDistribution = (opts) => useApi('/api/v1/government/tariff-distribution', opts);
export const useGovConsumptionTrend = (months = 6, opts) => useApi(`/api/v1/government/consumption-trend?months=${months}`, opts);
