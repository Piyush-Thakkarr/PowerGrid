import { useApi } from './useApi';

export const useGovOverview = () => useApi('/api/v1/government/overview');
export const useGovSegmentation = (clusters = 3) => useApi(`/api/v1/government/segmentation?clusters=${clusters}`);
export const useGovTariffDistribution = () => useApi('/api/v1/government/tariff-distribution');
export const useGovConsumptionTrend = (months = 6) => useApi(`/api/v1/government/consumption-trend?months=${months}`);
