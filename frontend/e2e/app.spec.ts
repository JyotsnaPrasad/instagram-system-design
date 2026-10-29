import { actAs, expect, MOBILE, postCard, postTexts, test } from './fixtures';

const P1 = 'Just finished a great novel.';
const P2 = 'Hello world! First post.';
const P3 = 'Sunrise hike this morning.';

test.describe('feed and acting user', () => {
  test('each demo user sees their seeded feed (AC-5.1 to AC-5.3)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByLabel('Acting as')).toHaveValue('u1');
    await expect.poll(() => postTexts(page)).toEqual([P3, P2]);

    await actAs(page, 'u2');
    await expect.poll(() => postTexts(page)).toEqual([P3, P2, P1]);

    await actAs(page, 'u3');
    await expect.poll(() => postTexts(page)).toEqual([P1]);
  });

  test('the acting user survives a reload (AC-0.3) and likes are per user (AC-2.5)', async ({ page }) => {
    await page.goto('/');
    await expect(postCard(page, P3).getByRole('button', { name: 'Like' })).toHaveAttribute('aria-pressed', 'true');

    await actAs(page, 'u2');
    await expect(postCard(page, P3).getByRole('button', { name: 'Like' })).toHaveAttribute('aria-pressed', 'false');

    await page.reload();
    await expect(page.getByLabel('Acting as')).toHaveValue('u2');
    await expect(page.locator('article')).toHaveCount(3);
  });
});

test.describe('creating posts', () => {
  test('blocks empty and over-long posts', async ({ page }) => {
    await page.goto('/');
    const composer = page.getByLabel(/What's on your mind/);
    const submit = page.getByRole('button', { name: 'Post', exact: true });

    await composer.fill('   ');
    await expect(submit).toBeDisabled();

    await composer.fill('x'.repeat(501));
    await expect(page.getByText('1 over the 500-character limit')).toBeVisible();
    await expect(composer).toHaveAttribute('aria-invalid', 'true');
    await expect(submit).toBeDisabled();

    await composer.fill('x'.repeat(500));
    await expect(page.getByText('500 / 500')).toBeVisible();
    await expect(submit).toBeEnabled();
  });

  test('a new post appears first, shows HTML as text, and reaches followers only', async ({ page }) => {
    await page.goto('/');
    const composer = page.getByLabel(/What's on your mind/);
    await composer.fill('Hello from the browser test 👋\n<b>not bold</b>');
    await page.getByRole('button', { name: 'Post', exact: true }).click();

    await expect(composer).toHaveValue('');
    const first = page.locator('article .post-text').first();
    await expect(first).toHaveText('Hello from the browser test 👋\n<b>not bold</b>');
    await expect(page.locator('article b')).toHaveCount(0);

    await actAs(page, 'u2'); // bob follows alice (AC-1.6)
    await expect(page.locator('article .post-text').first()).toContainText('Hello from the browser test');

    await actAs(page, 'u3'); // carol does not (AC-1.7)
    await expect.poll(() => postTexts(page)).toEqual([P1]);
  });
});

test.describe('likes and comments', () => {
  test('like and unlike update the count', async ({ page }) => {
    await page.goto('/');
    const post = postCard(page, P2);
    const like = post.getByRole('button', { name: 'Like' });

    await like.click();
    await expect(post.getByText('2 likes')).toBeVisible();
    await expect(like).toHaveAttribute('aria-pressed', 'true');

    await like.click();
    await expect(post.getByText('1 like', { exact: true })).toBeVisible();
    await expect(like).toHaveAttribute('aria-pressed', 'false');
  });

  test('comments appear in the feed and in full on the post page', async ({ page }) => {
    await page.goto('/');
    const post = postCard(page, P2);
    for (const text of ['First!', 'Nice to see you here.']) {
      await post.getByLabel('Add a comment').fill(text);
      await post.getByRole('button', { name: 'Post comment' }).click();
      await expect(post.getByText(text)).toBeVisible();
    }

    // Feed shows the 2 most recent comments; the seed comment moves behind "View all".
    await expect(post.getByText('Welcome!')).toHaveCount(0);
    await post.getByRole('link', { name: 'View all 3 comments' }).click();

    await expect(page).toHaveURL(/\/posts\/2$/);
    await expect(page.getByRole('heading', { name: '3 comments' })).toBeVisible();
    await expect(page.locator('.comment .user-text')).toHaveText(['Welcome!', 'First!', 'Nice to see you here.']);
  });

  test('empty comments cannot be submitted', async ({ page }) => {
    await page.goto('/');
    const post = postCard(page, P3);
    await post.getByLabel('Add a comment').fill('    ');
    await expect(post.getByRole('button', { name: 'Post comment' })).toBeDisabled();
  });
});

test.describe('profiles and following', () => {
  test('follow adds older posts to the feed; unfollow removes them (AC-4.2 to AC-4.4)', async ({ page }) => {
    await page.goto('/users/carol');
    await expect(page.getByRole('heading', { name: 'carol', level: 1 })).toBeVisible();
    await expect(page.locator('.profile-stats')).toContainText('1 follower');

    await page.getByRole('button', { name: 'Follow', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unfollow' })).toBeVisible();
    await expect(page.locator('.profile-stats')).toContainText('2 followers');

    await page.getByRole('tab', { name: 'Followers' }).click();
    await expect(page.getByRole('tabpanel').locator('.display-name')).toHaveText(['Alice Anderson', 'Bob Brown']);

    await page.getByRole('link', { name: 'Instaclone' }).click();
    await expect.poll(() => postTexts(page)).toEqual([P3, P2, P1]);

    await page.goto('/users/carol');
    await page.getByRole('button', { name: 'Unfollow' }).click();
    await expect(page.getByRole('button', { name: 'Follow', exact: true })).toBeVisible();
    await expect(page.locator('.profile-stats')).toContainText('1 follower');

    await page.goto('/');
    await expect.poll(() => postTexts(page)).toEqual([P3, P2]);
  });

  test('your own profile has no follow button (FR-4.3)', async ({ page }) => {
    await page.goto('/users/alice');
    await expect(page.getByText('This is you')).toBeVisible();
    await expect(page.getByRole('button', { name: /^(Follow|Unfollow)$/ })).toHaveCount(0);
  });

  test('following list and profile navigation', async ({ page }) => {
    await page.goto('/users/bob');
    await page.getByRole('tab', { name: 'Following' }).click();
    await page.getByRole('tabpanel').getByRole('link', { name: /Carol Chen/ }).click();
    await expect(page).toHaveURL(/\/users\/carol$/);
    await expect(page.getByText('Reads too many books.')).toBeVisible();
  });
});

test.describe('not found', () => {
  test.use({ expectedApiErrors: ['GET /api/posts/999 404', 'GET /api/users/nobody 404'] });

  test('unknown posts, profiles and routes show a not-found page (E27)', async ({ page }) => {
    await page.goto('/posts/999');
    await expect(page.getByText("Sorry, this post isn't available.")).toBeVisible();
    await page.goto('/users/nobody');
    await expect(page.getByText("Sorry, this profile isn't available.")).toBeVisible();
    await page.goto('/nowhere');
    await expect(page.getByText("Sorry, this page isn't available.")).toBeVisible();
    await page.getByRole('link', { name: 'Back to feed' }).click();
    await expect(page.locator('article')).toHaveCount(2);
  });
});

test.describe('reset demo data', () => {
  test('asks for confirmation, can be cancelled, and restores the seed', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel(/What's on your mind/).fill('This will be removed');
    await page.getByRole('button', { name: 'Post', exact: true }).click();
    await expect(page.locator('article')).toHaveCount(3);

    const open = page.getByRole('button', { name: 'Reset Demo Data' });
    const dialog = page.getByRole('dialog', { name: 'Reset demo data?' });

    await open.click();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    await expect(page.locator('article')).toHaveCount(3);

    await open.click();
    await dialog.getByRole('button', { name: 'Reset' }).click();
    await expect(page.getByText('Demo data restored.')).toBeVisible();
    await expect.poll(() => postTexts(page)).toEqual([P3, P2]);
  });
});

test.describe('accessibility basics', () => {
  test('the first Tab reaches the skip link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('article').first()).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  });
});

test.describe('mobile layout', () => {
  test.use(MOBILE);

  test('no horizontal scrolling and 44px touch targets', async ({ page }) => {
    const horizontalOverflow = () =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

    await page.goto('/');
    await expect(page.locator('article').first()).toBeVisible();
    // A long unbroken word must wrap, not widen the page (E8).
    await postCard(page, P3).getByLabel('Add a comment').fill('unbroken'.repeat(30));
    expect(await horizontalOverflow()).toBeLessThanOrEqual(0);

    const smallestTarget = await page.evaluate(() =>
      Math.min(
        ...[...document.querySelectorAll('.icon-btn, .link-btn, .user-list-link')].map((el) => {
          const box = el.getBoundingClientRect();
          return Math.min(box.width, box.height);
        }),
      ),
    );
    expect(smallestTarget).toBeGreaterThanOrEqual(44);

    await page.goto('/users/bob');
    await expect(page.getByRole('heading', { name: 'bob', level: 1 })).toBeVisible();
    expect(await horizontalOverflow()).toBeLessThanOrEqual(0);
  });
});
