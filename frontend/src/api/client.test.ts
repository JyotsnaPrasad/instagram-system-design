import { describe, expect, it, vi } from 'vitest';
import { apiRequest, ApiError } from './client';

function stubFetch(impl: () => Promise<Response>) {
  const fn = vi.fn(impl);
  vi.stubGlobal('fetch', fn);
  return fn;
}

describe('apiRequest', () => {
  it('prefixes /api and sends the acting user and JSON body', async () => {
    const fetchMock = stubFetch(async () => new Response('{"ok":true}', { status: 201 }));
    await apiRequest('/posts', { method: 'POST', actingUserId: 'u2', body: { text: 'hi' } });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/posts');
    const headers = init.headers as Record<string, string>;
    expect(headers['X-Acting-User']).toBe('u2');
    expect(headers['Content-Type']).toBe('application/json');
    expect(init.body).toBe('{"text":"hi"}');
  });

  it('turns the backend error shape into an ApiError', async () => {
    stubFetch(
      async () =>
        new Response(
          JSON.stringify({ status: 400, code: 'VALIDATION_ERROR', message: 'Post cannot be empty.', field: 'text' }),
          { status: 400 },
        ),
    );
    const error = await apiRequest('/posts').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR', message: 'Post cannot be empty.', field: 'text' });
  });

  it('explains an unreachable backend', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(apiRequest('/feed')).rejects.toMatchObject({ status: 0, message: expect.stringMatching(/reach the server/) });

    stubFetch(async () => new Response('proxy error', { status: 502 }));
    await expect(apiRequest('/feed')).rejects.toMatchObject({ status: 502, message: expect.stringMatching(/reach the server/) });
  });

  it('returns undefined for 204', async () => {
    stubFetch(async () => new Response(null, { status: 204 }));
    await expect(apiRequest('/demo/reset', { method: 'POST' })).resolves.toBeUndefined();
  });
});
