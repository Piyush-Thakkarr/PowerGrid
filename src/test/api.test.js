import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing api
vi.mock('../lib/supabase', () => ({
    supabase: {
        auth: {
            getSession: vi.fn().mockResolvedValue({
                data: { session: { access_token: 'test-jwt-token' } },
            }),
        },
    },
}));

// Must import after mock
const { apiFetch, API_BASE } = await import('../lib/api');

describe('apiFetch', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
    });

    it('adds Authorization header with Supabase JWT', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ data: 'test' }),
        });

        await apiFetch('/api/health');

        expect(global.fetch).toHaveBeenCalledWith(
            `${API_BASE}/api/health`,
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-jwt-token',
                }),
            })
        );
    });

    it('parses JSON response', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ status: 'ok' }),
        });

        const result = await apiFetch('/api/health');
        expect(result).toEqual({ status: 'ok' });
    });

    it('throws on non-OK response', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: () => Promise.resolve({ error: 'Unauthorized' }),
        });

        await expect(apiFetch('/api/profile')).rejects.toThrow('Unauthorized');
    });

    it('throws on 500 with fallback message', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: () => Promise.resolve({}),
        });

        await expect(apiFetch('/api/data')).rejects.toThrow('Request failed (500)');
    });

    it('sends POST with JSON body', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        await apiFetch('/api/profile', {
            method: 'PUT',
            body: JSON.stringify({ name: 'Test' }),
        });

        expect(global.fetch).toHaveBeenCalledWith(
            `${API_BASE}/api/profile`,
            expect.objectContaining({
                method: 'PUT',
                body: JSON.stringify({ name: 'Test' }),
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                }),
            })
        );
    });
});
