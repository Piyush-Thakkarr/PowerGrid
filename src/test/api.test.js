import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch, API_BASE } from '../lib/api';

describe('apiFetch', () => {
    beforeEach(() => {
        global.fetch = vi.fn();
        // Stub Clerk on window — apiFetch reads window.Clerk.session.getToken()
        global.window.Clerk = {
            session: {
                getToken: vi.fn().mockResolvedValue('test-jwt-token'),
            },
        };
    });

    it('adds Authorization header with Clerk JWT', async () => {
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
            json: () => Promise.resolve({ detail: 'Unauthorized' }),
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

    it('sends PUT with JSON body', async () => {
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

    it('still works when Clerk is unavailable', async () => {
        delete global.window.Clerk;
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ status: 'ok' }),
        });

        await apiFetch('/api/health');

        expect(global.fetch).toHaveBeenCalledWith(
            `${API_BASE}/api/health`,
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: 'Bearer ',
                }),
            })
        );
    });
});
