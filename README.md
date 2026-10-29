# instagram-system-design
Instagram-like social media system design using AI-assisted development

- [REQUIREMENTS.md](REQUIREMENTS.md): functional requirements, edge cases, acceptance criteria
- [ARCHITECTURE.md](ARCHITECTURE.md): modules, schema, REST API, feed logic

## Backend

Requires Java 17+. From `backend/`:

```bash
./mvnw spring-boot:run   # API on http://localhost:8080, data in backend/data/
./mvnw test              # run the test suite
```

On first start the database is seeded with three demo users (alice, bob, carol).
Send `X-Acting-User: u1` (or `u2`, `u3`) on requests to act as a user, and
`POST /api/demo/reset` to restore the demo data.

## Frontend

Requires Node 18+. Start the backend first, then from `frontend/`:

```bash
npm install
npm run dev        # http://localhost:5173, proxies /api to :8080
npm test           # unit and component tests
npm run lint
npm run build      # type-checks, then builds to dist/
```

## Browser tests (end to end)

Playwright tests drive Chromium against the real Spring Boot backend and the Vite
frontend. You don't need to start either one: Playwright starts both, and the
backend uses its own H2 file under `backend/target/e2e-data/`, so your
`backend/data/` is never touched. Needs Java 17+ and Node 18+.

From `frontend/`:

```bash
npx playwright install chromium   # once per machine
npm run test:e2e                  # 14 tests: feed, posting, likes, comments, follows, reset, mobile
npm run screenshots               # regenerate docs/screenshots/
```

Each test resets the demo data first and fails on any browser console error or
unexpected API error. If a backend or dev server is already running on :8080 or
:5173, Playwright reuses it, and the tests reset its data. A failing run leaves an
HTML report in `frontend/playwright-report/` (`npx playwright show-report`).

## Screenshots

Captured from the running app by `npm run screenshots`, using demo data only.

| | |
|---|---|
| **Feed** (alice) | **Creating a post** |
| ![Alice's feed](docs/screenshots/01-feed.png) | ![Post composer with text](docs/screenshots/02-create-post.png) |
| **New post at the top of the feed** | **Likes and comments** (bob liked and commented) |
| ![Feed with the new post first](docs/screenshots/03-post-created.png) | ![Post with a like and a comment](docs/screenshots/04-likes-comments.png) |
| **Profile** (carol, not followed) | **After following** (followers tab) |
| ![Carol's profile with a Follow button](docs/screenshots/05-profile.png) | ![Carol's profile with Unfollow and two followers](docs/screenshots/06-followed.png) |
| **Feed after following carol** | **Reset Demo Data confirmation** |
| ![Feed including carol's older post](docs/screenshots/07-feed-after-follow.png) | ![Reset confirmation dialog](docs/screenshots/10-reset-dialog.png) |
| **Mobile feed** | **Mobile profile** |
| ![Mobile feed](docs/screenshots/08-mobile-feed.png) | ![Mobile profile](docs/screenshots/09-mobile-profile.png) |
