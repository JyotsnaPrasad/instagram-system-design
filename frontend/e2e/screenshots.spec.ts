import path from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { actAs, expect, MOBILE, postCard, test } from './fixtures';

/**
 * Regenerates the README screenshots in docs/screenshots/ from the running app.
 * Only the seeded demo users and demo text appear. Run with `npm run screenshots`.
 */

const DESKTOP = { width: 1280, height: 900 };

function outPath(name: string) {
  return path.resolve(test.info().project.testDir, '../../docs/screenshots', name);
}

async function shoot(target: Page | Locator, name: string, fullPage = false) {
  const options = { path: outPath(name), animations: 'disabled' as const, caret: 'hide' as const };
  if ('goto' in target) await target.screenshot({ ...options, fullPage });
  else await target.screenshot(options);
}

test.describe('desktop', () => {
  test.use({ viewport: DESKTOP, colorScheme: 'light' });

  test('feed, posting, likes and comments', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('article')).toHaveCount(2);
    await shoot(page, '01-feed.png');

    await page.getByLabel(/What's on your mind/).fill('Trying out Instaclone today ☕\nText posts only, no photos needed.');
    await shoot(page.locator('.composer'), '02-create-post.png');

    await page.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(page.getByLabel(/What's on your mind/)).toHaveValue('');
    await expect(page.locator('article')).toHaveCount(3);
    await shoot(page, '03-post-created.png');

    await actAs(page, 'u2');
    const post = postCard(page, 'Trying out Instaclone today');
    await post.getByRole('button', { name: 'Like' }).click();
    await expect(post.getByText('1 like', { exact: true })).toBeVisible();
    await post.getByLabel('Add a comment').fill('Welcome aboard, Alice!');
    await post.getByRole('button', { name: 'Post comment' }).click();
    await expect(post.getByText('Welcome aboard, Alice!')).toBeVisible();
    await page.mouse.move(0, 0);
    await shoot(post, '04-likes-comments.png');
  });

  test('profiles and follow/unfollow', async ({ page }) => {
    await page.goto('/users/carol');
    await expect(page.getByRole('button', { name: 'Follow', exact: true })).toBeVisible();
    await expect(page.locator('article')).toHaveCount(1);
    await shoot(page, '05-profile.png');

    await page.getByRole('button', { name: 'Follow', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unfollow' })).toBeVisible();
    await page.getByRole('tab', { name: 'Followers' }).click();
    await expect(page.getByRole('tabpanel').locator('.display-name')).toHaveCount(2);
    await page.mouse.move(0, 0);
    await shoot(page, '06-followed.png');

    await page.getByRole('link', { name: 'Instaclone' }).click();
    await expect(page.locator('article')).toHaveCount(3);
    await shoot(page, '07-feed-after-follow.png', true);
  });

  test('reset dialog', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('article')).toHaveCount(2);
    await page.getByRole('button', { name: 'Reset Demo Data' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await shoot(page, '10-reset-dialog.png');
  });
});

test.describe('mobile', () => {
  test.use({ ...MOBILE, colorScheme: 'light' });

  test('feed and profile', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('article')).toHaveCount(2);
    await shoot(page, '08-mobile-feed.png');

    await page.goto('/users/bob');
    await expect(page.locator('article')).toHaveCount(1);
    await shoot(page, '09-mobile-profile.png');
  });
});
