import path from 'node:path';
import type { Locator } from '@playwright/test';
import { expect, postCard, postTexts, test } from './fixtures';

/**
 * Records the README walkthrough video of the real app (backend + Vite) with demo data.
 * Run `npm run demo:record`, then `npm run demo:mp4` to convert it to docs/demo/.
 *
 * Playwright's video does not show the mouse pointer, so a small cursor overlay follows
 * the real mouse events, and a caption names each step. Everything else is the live app.
 */

const RAW_VIDEO = 'demo-video/walkthrough.webm';

// Injected into every page load: a cursor that tracks mouse events, a click pulse,
// and a caption bar. pointer-events: none keeps them out of the app's way.
function installOverlay() {
  const css = `
    #demo-cursor { position: fixed; left: 0; top: 0; width: 22px; height: 22px; z-index: 2147483647;
      pointer-events: none; transform: translate(-100px, -100px); transition: transform 0.02s linear; }
    #demo-cursor svg { filter: drop-shadow(0 1px 2px rgba(0,0,0,0.45)); }
    .demo-pulse { position: fixed; width: 36px; height: 36px; margin: -18px 0 0 -18px; border-radius: 50%;
      background: rgba(0,149,246,0.35); border: 2px solid rgba(0,149,246,0.8); pointer-events: none;
      z-index: 2147483646; animation: demo-pulse 0.5s ease-out forwards; }
    @keyframes demo-pulse { from { transform: scale(0.4); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }
    #demo-caption { position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%); z-index: 2147483645;
      pointer-events: none; padding: 10px 18px; border-radius: 999px; background: rgba(38,38,38,0.88); color: #fff;
      font: 600 16px/1.3 -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; white-space: nowrap;
      box-shadow: 0 6px 20px rgba(0,0,0,0.25); transition: opacity 0.25s; }
    #demo-caption:empty { opacity: 0; }
    #demo-caption .step { color: #7cc4ff; margin-right: 8px; }`;
  const setup = () => {
    if (document.getElementById('demo-cursor')) return;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML =
      '<svg viewBox="0 0 24 24" width="22" height="22"><path d="M3 2l7 19 2.5-7.5L20 11z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    document.body.appendChild(cursor);
    const caption = document.createElement('div');
    caption.id = 'demo-caption';
    document.body.appendChild(caption);
    document.addEventListener('mousemove', (e) => {
      cursor.style.transform = `translate(${e.clientX - 3}px, ${e.clientY - 2}px)`;
    }, true);
    document.addEventListener('mousedown', (e) => {
      const pulse = document.createElement('div');
      pulse.className = 'demo-pulse';
      pulse.style.left = `${e.clientX}px`;
      pulse.style.top = `${e.clientY}px`;
      document.body.appendChild(pulse);
      setTimeout(() => pulse.remove(), 600);
    }, true);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
}

test.use({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  video: { mode: 'on', size: { width: 1280, height: 800 } },
});

test.setTimeout(180_000);

test('walkthrough', async ({ page }) => {
  const pause = (ms: number) => page.waitForTimeout(ms);
  let mouse = { x: 640, y: 400 };

  async function moveTo(target: Locator) {
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    if (!box) throw new Error('target not visible');
    const to = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    const distance = Math.hypot(to.x - mouse.x, to.y - mouse.y);
    await page.mouse.move(to.x, to.y, { steps: Math.max(12, Math.round(distance / 18)) });
    mouse = to;
    await pause(250);
  }

  async function click(target: Locator) {
    await moveTo(target);
    await page.mouse.down();
    await page.mouse.up();
    await pause(400);
  }

  async function type(target: Locator, text: string) {
    await click(target);
    await target.pressSequentially(text, { delay: 55 });
    await pause(400);
  }

  async function chooseUser(id: string) {
    const select = page.getByLabel('Acting as');
    await click(select);
    await select.selectOption(id);
    await pause(300);
  }

  async function caption(step: number | null, text: string) {
    await page.evaluate(
      ([s, t]) => {
        const el = document.getElementById('demo-caption');
        if (el) el.innerHTML = t ? (s ? `<span class="step">${s}</span>${t}` : t) : '';
      },
      [step === null ? '' : `${step}/7`, text] as const,
    );
  }

  async function smoothScroll(y: number) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'smooth' }), y);
    await pause(900);
  }

  await page.addInitScript(installOverlay);

  // 1. Home feed with seeded posts
  await page.goto('/');
  await expect.poll(() => postTexts(page)).toEqual(['Sunrise hike this morning.', 'Hello world! First post.']);
  await page.mouse.move(mouse.x, mouse.y);
  await caption(1, 'Home feed: alice sees her posts and posts from people she follows');
  await pause(2500);
  await moveTo(postCard(page, 'Sunrise hike this morning.').locator('.post-text'));
  await moveTo(postCard(page, 'Hello world! First post.').locator('.comment'));
  await pause(1200);

  // 2. Switching demo users
  await caption(2, 'Switch demo users with the “Acting as” menu');
  await pause(1200);
  await chooseUser('u2');
  await expect(page.locator('article')).toHaveCount(3);
  await caption(2, 'bob also follows carol, so her post is in his feed');
  await smoothScroll(400);
  await pause(1500);
  await smoothScroll(0);
  await chooseUser('u3');
  await expect(page.locator('article')).toHaveCount(1);
  await caption(2, 'carol follows nobody: she only sees her own post');
  await pause(2200);
  await chooseUser('u1');
  await expect(page.locator('article')).toHaveCount(2);

  // 3. Creating a post
  await caption(3, 'Create a text post as alice');
  const composer = page.getByLabel(/What's on your mind/);
  await type(composer, 'Hello from the demo walkthrough! ☕');
  await pause(600);
  await click(page.getByRole('button', { name: 'Post', exact: true }));
  await expect(page.locator('article .post-text').first()).toHaveText('Hello from the demo walkthrough! ☕');
  await caption(3, 'The new post appears at the top of the feed');
  await pause(2200);

  // 4. Liking and commenting (as bob, on alice's new post)
  await caption(4, 'bob likes and comments on alice’s new post');
  await chooseUser('u2');
  const newPost = postCard(page, 'Hello from the demo walkthrough!');
  await expect(newPost).toBeVisible();
  await pause(600);
  await click(newPost.getByRole('button', { name: 'Like' }));
  await expect(newPost.getByText('1 like', { exact: true })).toBeVisible();
  await pause(700);
  await type(newPost.getByLabel('Add a comment'), 'Welcome aboard, Alice! 👋');
  await click(newPost.getByRole('button', { name: 'Post comment' }));
  await expect(newPost.getByText('Welcome aboard, Alice! 👋')).toBeVisible();
  await pause(2000);

  // 5. Following a user and seeing their posts in the feed
  await caption(5, 'alice visits carol’s profile and follows her');
  await chooseUser('u1');
  await click(page.getByRole('navigation', { name: 'Demo users' }).getByRole('link', { name: /Carol Chen/ }));
  await expect(page.getByRole('button', { name: 'Follow', exact: true })).toBeVisible();
  await pause(1500);
  await click(page.getByRole('button', { name: 'Follow', exact: true }));
  await expect(page.getByRole('button', { name: 'Unfollow' })).toBeVisible();
  await expect(page.locator('.profile-stats')).toContainText('2 followers');
  await pause(1800);
  await click(page.getByRole('link', { name: 'Instaclone' }));
  await expect(page.locator('article')).toHaveCount(4);
  await caption(5, 'carol’s post now appears in alice’s feed, in time order');
  await smoothScroll(700);
  await moveTo(postCard(page, 'Just finished a great novel.').locator('.post-text'));
  await pause(2000);
  await smoothScroll(0);

  // 6. Refresh: data is stored on the backend
  await caption(6, 'Refresh the page: everything is saved on the backend');
  await pause(1500);
  await page.reload();
  await expect(page.locator('article')).toHaveCount(4);
  await page.mouse.move(mouse.x + 1, mouse.y + 1);
  await caption(6, 'After reload: same user, new post, like, comment and follow are all still there');
  await moveTo(postCard(page, 'Hello from the demo walkthrough!').getByText('Welcome aboard, Alice! 👋'));
  await pause(2800);

  // 7. Reset demo data
  await caption(7, 'Reset Demo Data asks for confirmation first');
  await click(page.getByRole('button', { name: 'Reset Demo Data' }));
  const dialog = page.getByRole('dialog', { name: 'Reset demo data?' });
  await expect(dialog).toBeVisible();
  await pause(2200);
  await click(dialog.getByRole('button', { name: 'Reset' }));
  await expect(page.getByText('Demo data restored.')).toBeVisible();
  await expect.poll(() => postTexts(page)).toEqual(['Sunrise hike this morning.', 'Hello world! First post.']);
  await caption(7, 'Back to the original demo data');
  await pause(3000);

  await caption(null, '');
  await page.close();
  await page.video()!.saveAs(path.join(test.info().project.outputDir, RAW_VIDEO));
});
