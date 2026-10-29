import { expect, test as base, type APIRequestContext, type Page } from '@playwright/test';

export const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

/** Restores the seed data from REQUIREMENTS.md section 4. */
export async function resetDemoData(request: APIRequestContext) {
  const response = await request.post('/api/demo/reset');
  expect(response.status()).toBe(204);
}

/** Post texts in the order they are shown. */
export function postTexts(page: Page) {
  return page.locator('article .post-text').allTextContents();
}

export function postCard(page: Page, text: string) {
  return page.locator('article', { has: page.locator('.post-text', { hasText: text }) });
}

export async function actAs(page: Page, userId: 'u1' | 'u2' | 'u3') {
  await page.getByLabel('Acting as').selectOption(userId);
}

type Options = {
  /** API responses with status >= 400 that a test triggers on purpose, e.g. "GET /api/posts/999 404". */
  expectedApiErrors: string[];
};

/**
 * Every test starts from freshly reset demo data and fails if the page logs a console
 * error or the API returns an error the test did not expect.
 */
export const test = base.extend<Options & { guard: void }>({
  expectedApiErrors: [[], { option: true }],
  guard: [
    async ({ page, request, expectedApiErrors }, use) => {
      await resetDemoData(request);
      const consoleErrors: string[] = [];
      const apiErrors: string[] = [];
      page.on('pageerror', (error) => consoleErrors.push(String(error)));
      page.on('console', (message) => {
        // The browser logs every non-2xx fetch; those are checked via apiErrors instead.
        if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) {
          consoleErrors.push(message.text());
        }
      });
      page.on('response', (response) => {
        const url = new URL(response.url());
        if (url.pathname.startsWith('/api/') && response.status() >= 400) {
          apiErrors.push(`${response.request().method()} ${url.pathname} ${response.status()}`);
        }
      });
      await use();
      expect(consoleErrors, 'browser console errors').toEqual([]);
      expect(apiErrors.filter((e) => !expectedApiErrors.includes(e)), 'unexpected API errors').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
