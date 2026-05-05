import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../lib/api', () => ({
    apiFetch: vi.fn(),
    API_BASE: 'http://localhost:8000',
}));

const { apiFetch } = await import('../lib/api');

describe('useChartData hook', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('fetches hourly data and maps to chart format', async () => {
        apiFetch.mockResolvedValue([
            { hour: '2020-07-15T08:00:00', kwh: 1.2, avgWatts: 240, avgVoltage: 230 },
            { hour: '2020-07-15T09:00:00', kwh: 1.5, avgWatts: 300, avgVoltage: 228 },
        ]);
        const { useChartData } = await import('../hooks/useChartData');
        const { result } = renderHook(() => useChartData('hourly'));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toHaveLength(2);
        expect(result.current.data[0]).toHaveProperty('time');
        expect(result.current.data[0]).toHaveProperty('units');
        expect(result.current.chartKey).toBe('time');
    });

    it('fetches daily data and maps day names', async () => {
        apiFetch.mockResolvedValue([{ date: '2020-07-13', kwh: 12.5, peakWatts: 1800, avgWatts: 520 }]);
        const { useChartData } = await import('../hooks/useChartData');
        const { result } = renderHook(() => useChartData('daily'));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data[0]).toHaveProperty('day');
        expect(result.current.chartKey).toBe('day');
    });

    it('fetches monthly data and maps month names', async () => {
        apiFetch.mockResolvedValue([{ month: '2020-07', kwh: 250, avgWatts: 350, readings: 8640 }]);
        const { useChartData } = await import('../hooks/useChartData');
        const { result } = renderHook(() => useChartData('monthly'));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data[0]).toHaveProperty('month');
        expect(result.current.chartKey).toBe('month');
    });
});

describe('useMLData hooks', () => {
    beforeEach(() => { vi.clearAllMocks(); });

    it('fetches forecast comparison', async () => {
        apiFetch.mockResolvedValue({
            sarima: { predictions: [{ date: '2020-07-16', predicted: 12.5 }] },
            prophet: { predictions: [{ date: '2020-07-16', predicted: 13.0 }] },
            bestModel: 'prophet',
        });
        const { useMLForecast } = await import('../hooks/useMLData');
        const { result } = renderHook(() => useMLForecast());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data.bestModel).toBe('prophet');
        expect(result.current.data.sarima.predictions).toHaveLength(1);
    });

    it('fetches anomalies', async () => {
        apiFetch.mockResolvedValue({
            anomalies: [{ date: '2020-07-10', actual: 18.5, expected: 12.0, deviationPercent: 54, severity: 'high' }],
            anomalyCount: 1,
        });
        const { useMLAnomalies } = await import('../hooks/useMLData');
        const { result } = renderHook(() => useMLAnomalies());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data.anomalyCount).toBe(1);
        expect(result.current.data.anomalies[0].severity).toBe('high');
    });

    it('fetches recommendations', async () => {
        apiFetch.mockResolvedValue([{ id: 1, title: 'Shift AC', estimatedSavings: 420, priority: 'high' }]);
        const { useMLRecommendations } = await import('../hooks/useMLData');
        const { result } = renderHook(() => useMLRecommendations());
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.data).toHaveLength(1);
        expect(result.current.data[0].priority).toBe('high');
    });
});
