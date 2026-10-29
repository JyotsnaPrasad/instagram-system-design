# Instagram-like MVP — Requirements

Status: Draft (requirements only; no implementation yet)

## 1. Overview

A small, text-only social app modeled on Instagram. Users can publish short text
posts, like and comment on posts, and follow or unfollow other users. Each user
sees a chronological feed of posts from the people they follow plus their own.

The MVP runs with three pre-seeded demo users. There is no sign-up, login, or
password: the person using the app picks which demo user to "act as" from a
user switcher.

### 1.1 Goals

- Show the core social loop: post, react, follow, see a feed.
- Keep the behavior predictable and fully testable with a fixed seed dataset.

### 1.2 Out of scope

- Authentication, authorization, sessions, passwords, sign-up.
- Image, video, or any file upload; media in posts.
- Editing or deleting posts and comments.
- Unliking comments, liking comments, nested/threaded replies.
- Notifications, direct messages, stories, hashtags, mentions, search.
- Ranked or algorithmic feeds, recommendations ("suggested users").
- Private accounts, blocking, follow requests, moderation, reporting.
- Creating, editing, or deleting users (the user set is fixed).
- Real-time push updates (data refreshes on navigation or after an action).
- Pagination/infinite scroll (see NFR-4 for the expected data size).

## 2. Glossary

| Term | Meaning |
|---|---|
| Acting user | The demo user currently selected in the user switcher. All actions are performed as this user. |
| Post | A text entry written by one user. |
| Like | A record that one user likes one post. At most one per (user, post). |
| Comment | A text reply by one user to one post. |
| Follow | A one-directional relationship: follower → followee. |
| Feed | The list of posts shown to the acting user (see FR-5). |

## 3. Data model (logical)

Field names are illustrative; the implementation may choose its own names and storage.

**User** (fixed, seeded)
- `id` — stable unique identifier
- `username` — unique, lowercase, e.g. `alice`
- `displayName` — e.g. `Alice Anderson`
- `bio` — optional short text

**Post**
- `id` — unique, assigned by the system
- `authorId` — references User
- `text` — 1–500 characters after trimming (see FR-1)
- `createdAt` — timestamp assigned by the system at creation (UTC)

**Like**
- `userId`, `postId` — the pair is unique
- `createdAt`

**Comment**
- `id`, `postId`, `authorId`
- `text` — 1–300 characters after trimming
- `createdAt`

**Follow**
- `followerId`, `followeeId` — the pair is unique; `followerId ≠ followeeId`
- `createdAt`

Derived values (computed, never stored inconsistently):
- Post like count = number of Like records for the post.
- Post comment count = number of Comment records for the post.
- User follower count / following count = number of matching Follow records.

## 4. Demo users and seed data

The app starts with exactly these three users:

| id | username | displayName | bio |
|---|---|---|---|
| u1 | `alice` | Alice Anderson | Coffee and code. |
| u2 | `bob` | Bob Brown | Weekend hiker. |
| u3 | `carol` | Carol Chen | Reads too many books. |

Seed follow graph (chosen so each feed starts out different):

- alice → bob
- bob → alice
- bob → carol
- carol follows nobody

Seed posts (timestamps relative to seed time T, newest last):

| id | author | text | createdAt |
|---|---|---|---|
| p1 | carol | "Just finished a great novel." | T − 3h |
| p2 | alice | "Hello world! First post." | T − 2h |
| p3 | bob | "Sunrise hike this morning." | T − 1h |

Seed interactions:

- alice likes p3; carol likes p2.
- bob comments on p2: "Welcome!"

Default acting user on first load: `alice`.

A visible **Reset Demo Data** button restores exactly this seed state.

## 5. Functional requirements

### FR-0 User switcher (stand-in for authentication)

- FR-0.1 The UI shows a control listing the three demo users and indicates the current acting user.
- FR-0.2 Choosing a user makes them the acting user immediately; all views refresh to that user's perspective (feed, like state, follow buttons).
- FR-0.3 The acting-user choice persists across page reloads in the same browser.
- FR-0.4 Every write request identifies the acting user. The backend rejects requests that name an unknown user.

### FR-1 Create a text post

- FR-1.1 The acting user can write a post in a text box and submit it.
- FR-1.2 Leading and trailing whitespace is trimmed before validation and storage. Internal whitespace and line breaks are kept.
- FR-1.3 Trimmed text must be 1–500 characters (counted as Unicode characters, so an emoji counts as one). Otherwise the post is rejected with a clear message and nothing is saved.
- FR-1.4 The system sets `authorId` to the acting user and `createdAt` to the server's current time. The client cannot set either.
- FR-1.5 Text is stored and displayed as plain text. Any HTML or script content is shown literally, never rendered or run.
- FR-1.6 After a successful submit, the new post appears at the top of the acting user's feed and on their profile, and the text box clears.
- FR-1.7 The submit button is disabled while a submission is in flight, so a double-click creates only one post.
- FR-1.8 The UI shows a live character counter and disables submit when the trimmed text is empty or over 500.

### FR-2 Like / unlike a post

- FR-2.1 Every post shows its like count and whether the acting user has liked it.
- FR-2.2 The acting user can like any post, including their own.
- FR-2.3 Liking an already-liked post has no further effect (idempotent): the count never goes above one per user.
- FR-2.4 The acting user can remove their own like (unlike). Unliking a post they have not liked has no effect and is not an error.
- FR-2.5 The UI shows the like/unlike control as a toggle that reflects the current state.
- FR-2.6 Liking or unliking a post that does not exist returns a "not found" error.

### FR-3 Comment on a post

- FR-3.1 The acting user can add a comment to any post, including their own.
- FR-3.2 Comment text follows the same trimming, plain-text, and in-flight rules as posts (FR-1.2, FR-1.5, FR-1.7), with a 1–300 character limit.
- FR-3.3 Comments on a post are listed oldest first, each showing author display name, username, text, and relative time.
- FR-3.4 Each post shows its comment count. In the feed, a post shows up to its 2 most recent comments and a "View all N comments" link when there are more; the post detail view shows all of them.
- FR-3.5 Commenting on a post that does not exist returns a "not found" error.
- FR-3.6 A user may post several comments on the same post, including identical text.

### FR-4 Follow / unfollow

- FR-4.1 Each user has a profile page showing display name, username, bio, post count, follower count, following count, and that user's posts newest first.
- FR-4.2 On another user's profile, the acting user sees a "Follow" button if not following them, or "Unfollow" if they are.
- FR-4.3 On their own profile, the acting user sees no follow button.
- FR-4.4 Following is one-directional. A following B does not make B follow A.
- FR-4.5 Following someone already followed has no further effect (idempotent). Unfollowing someone not followed has no effect and is not an error.
- FR-4.6 Following or unfollowing oneself is rejected with a validation error, including when the request is sent directly to the backend.
- FR-4.7 Following or unfollowing a user that does not exist returns a "not found" error.
- FR-4.8 Follower and following counts update immediately on both affected profiles.
- FR-4.9 A profile offers a list of the user's followers and a list of who they follow, each entry linking to that profile.
- FR-4.10 Likes and comments made earlier are kept when a follow is removed.

### FR-5 Chronological feed

- FR-5.1 The feed for the acting user contains every post whose author is either the acting user or someone the acting user currently follows. It contains no other posts.
- FR-5.2 Posts are sorted by `createdAt`, newest first. Ties are broken by post `id`, descending, so the order is always stable.
- FR-5.3 Each feed item shows author display name and username (linking to the profile), post text, relative time ("5m ago") with the exact time available on hover, like count and like toggle, comment count, recent comments, and a comment box.
- FR-5.4 Following a user adds all of their existing posts (not just future ones) to the feed in the correct chronological positions. Unfollowing removes them.
- FR-5.5 When the feed is empty, it shows a message such as "No posts yet. Follow someone or write your first post." with links to the other demo users' profiles.
- FR-5.6 The feed reflects the acting user's own actions (new post, like, comment, follow) without a manual page reload.

### FR-6 Navigation

- FR-6.1 The app has at least: Feed (home), Profile (per user), and Post detail.
- FR-6.2 A sidebar or header lists all three demo users with links to their profiles.

## 6. Non-functional requirements

- NFR-1 **Persistence:** Data survives a page reload and a server restart. The reset action (Section 4) is the only thing that clears it.
- NFR-2 **Consistency:** Counts shown always match the underlying records after any action completes. Concurrent duplicate like/follow requests never create duplicate records (enforce uniqueness at the storage level).
- NFR-3 **Validation lives on the server.** Client-side checks are for convenience only; every rule in Section 5 is also enforced by the backend.
- NFR-4 **Scale:** Designed for demo use: 3 users and up to ~1,000 posts. Feed loads in under 500 ms locally at that size.
- NFR-5 **Security:** All user text is escaped on output (no XSS). Errors return a clear message and the right status (400 validation, 404 not found) without stack traces.
- NFR-6 **Time:** Timestamps are stored in UTC and shown in the browser's local time zone.
- NFR-7 **Accessibility:** All controls are reachable by keyboard and have accessible labels. Like and follow toggles expose their state (e.g. `aria-pressed`).
- NFR-8 **Responsive:** Usable at mobile width (360 px) and desktop width.

## 7. Edge cases

| # | Case | Expected behavior |
|---|---|---|
| E1 | Post or comment is empty or only whitespace/newlines | Rejected; nothing saved; message "Post cannot be empty." / "Comment cannot be empty." |
| E2 | Post exactly 500 chars (comment exactly 300) after trim | Accepted. |
| E3 | Post 501 chars (comment 301) after trim | Rejected with length message; nothing saved. |
| E4 | Text is 500 chars plus surrounding spaces | Accepted (length is measured after trimming). |
| E5 | Text includes emoji, accented or non-Latin characters, RTL text | Stored and displayed correctly; each Unicode character counts as one. |
| E6 | Text includes `<script>alert(1)</script>` or other HTML | Shown literally as text; nothing runs. |
| E7 | Text includes line breaks | Line breaks preserved on display. |
| E8 | Very long word or URL with no spaces | Wraps inside the card; no horizontal page scroll. URLs are not auto-linked. |
| E9 | Double-clicking Post / Comment submit | Exactly one record created. |
| E10 | Rapid repeated clicks on Like | Final state matches the last intended toggle; count is 0 or 1 for this user, never 2+ or negative. |
| E11 | Like request sent twice directly to the backend | Second request is a no-op; count unchanged. |
| E12 | Unlike a post never liked | No-op; count unchanged; no error. |
| E13 | User likes / comments on their own post | Allowed. |
| E14 | User tries to follow themselves (UI or direct request) | No button in UI; backend returns 400; no record created. |
| E15 | Follow a user already followed | No-op; counts unchanged. |
| E16 | Unfollow a user not followed | No-op; no error. |
| E17 | Mutual follow (A→B and B→A) | Both records exist independently; unfollowing one leaves the other. |
| E18 | Unfollow a user whose post the acting user liked/commented on | Their posts leave the feed; the like and comment remain and are still visible on the post detail and author's profile. |
| E19 | Acting user follows nobody (e.g. carol after reset) | Feed shows only carol's own posts; if none, the empty-state message. |
| E20 | Two posts with identical `createdAt` | Ordered by post `id` descending; order stable across reloads. |
| E21 | Request names an unknown user id, post id, or target user | 404 (unknown post/target) or 400 (unknown acting user); nothing saved. |
| E22 | Switching acting user while a request is in flight | The request completes as the user who started it; the UI then shows the new acting user's view. |
| E23 | Acting user stored in the browser no longer exists (e.g. corrupted value) | Falls back to `alice`. |
| E24 | Post with zero likes / zero comments | Shows "0 likes" / no comment list; grammar handles 1 vs many ("1 like", "2 likes"). |
| E25 | Post has many comments (e.g. 50) | Feed shows 2 most recent + "View all 50 comments"; detail shows all. |
| E26 | Viewing a profile of a user with no posts | Profile shows "No posts yet." |
| E27 | Navigating to a non-existent profile or post URL | "Not found" page with a link back to the feed. |
| E28 | Reset while data exists | All posts, likes, comments, and follows return to exactly the seed state. |

## 8. Acceptance criteria

All criteria assume the app was just reset to the seed state (Section 4) unless stated.

### AC-0 User switcher
- **AC-0.1** Given a fresh load, the acting user is alice.
- **AC-0.2** Given the acting user is alice, when I switch to bob, then the feed shows bob's feed and the like toggles reflect bob's likes (p3 shows "not liked").
- **AC-0.3** Given I switched to carol, when I reload the page, then carol is still the acting user.

### AC-1 Create post
- **AC-1.1** Given I am alice, when I submit "My new post", then it appears first in my feed with my name and "just now", and the text box clears.
- **AC-1.2** Given I am alice, when I submit "   " (spaces only), then I see "Post cannot be empty." and no post is created.
- **AC-1.3** Given I am alice, when I enter 501 characters, then the counter shows I am over the limit, submit is disabled, and a direct backend request with the same text returns 400.
- **AC-1.4** Given I am alice, when I submit exactly 500 characters, then the post is created.
- **AC-1.5** Given I am alice and I post `<b>hi</b>`, then the feed shows the literal text `<b>hi</b>`, not bold text.
- **AC-1.6** Given alice posts, when I switch to bob (who follows alice), then bob's feed shows alice's new post first.
- **AC-1.7** Given alice posts, when I switch to carol (who does not follow alice), then carol's feed does not show it.

### AC-2 Likes
- **AC-2.1** Given I am bob and p2 shows "1 like", when I like p2, then it shows "2 likes" and the toggle shows liked.
- **AC-2.2** Given bob has liked p2, when bob clicks the toggle again, then p2 shows "1 like" and the toggle shows not liked.
- **AC-2.3** Given I am alice and p3 is already liked by alice, when a like request for p3 is sent again, then p3 still shows "1 like".
- **AC-2.4** Given I am alice, when I like my own post p2, then it is allowed and the count increases by one.
- **AC-2.5** Given I am alice and I liked p3, when I switch to bob, then p3 shows "1 like" and bob's toggle shows not liked.

### AC-3 Comments
- **AC-3.1** Given I am alice, when I comment "Nice!" on p3, then the comment appears under p3 with my name, and p3's comment count increases by one.
- **AC-3.2** Given I am alice, when I submit an empty comment, then I see "Comment cannot be empty." and nothing is saved.
- **AC-3.3** Given p2 has 3 or more comments, then the feed shows the 2 most recent and "View all N comments"; opening the post shows all N, oldest first.
- **AC-3.4** Given a comment of exactly 300 characters, it is accepted; 301 is rejected.

### AC-4 Follow / unfollow
- **AC-4.1** Given I am alice viewing carol's profile, then I see "Follow", carol shows 1 follower (bob).
- **AC-4.2** Given AC-4.1, when I click Follow, then the button becomes "Unfollow", carol shows 2 followers, and alice's profile shows following 2.
- **AC-4.3** Given AC-4.2, when I open my feed, then it shows p3, p2, p1 in that order (carol's p1 now included in its correct position).
- **AC-4.4** Given alice follows carol, when alice unfollows carol, then p1 disappears from alice's feed and counts return to their previous values.
- **AC-4.5** Given I am alice viewing my own profile, then no Follow/Unfollow button is shown.
- **AC-4.6** Given a direct backend request for alice to follow alice, then it returns 400 and no follow is created.
- **AC-4.7** Given bob follows alice and alice follows bob, when alice unfollows bob, then bob still follows alice.
- **AC-4.8** Given alice liked p3, when alice unfollows bob, then p3 leaves alice's feed but still shows alice's like on bob's profile and on the p3 detail page.

### AC-5 Feed
- **AC-5.1** Given a reset, alice's feed shows exactly p3, p2 (newest first).
- **AC-5.2** Given a reset, bob's feed shows exactly p3, p2, p1.
- **AC-5.3** Given a reset, carol's feed shows exactly p1.
- **AC-5.4** Given carol has no posts and follows nobody (p1 removed for this test via a custom seed), then the feed shows the empty-state message with links to alice and bob.
- **AC-5.5** Given two posts with the same `createdAt`, then the one with the larger id appears first, and the order is the same after reload.
- **AC-5.6** Given I perform any post/like/comment/follow action, then the feed updates without a manual reload.

### AC-6 Persistence and reset
- **AC-6.1** Given alice creates a post, when the server restarts and I reload, then the post is still there.
- **AC-6.2** Given any changes, when reset is triggered, then the data matches Section 4 exactly.

### AC-7 Not found
- **AC-7.1** Given I open `/users/nobody`, then I see a not-found page with a link to the feed.
- **AC-7.2** Given a like or comment request for a post id that does not exist, then it returns 404 and nothing is saved.

## 9. Suggested API surface (for later design)

Not binding; included to make the requirements concrete. The acting user is
passed as a header (e.g. `X-Acting-User: u1`) since there is no auth.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/users` | List demo users |
| GET | `/api/users/:username` | Profile with counts and `isFollowedByMe` |
| GET | `/api/users/:username/posts` | User's posts, newest first |
| GET | `/api/users/:username/followers` | Followers list |
| GET | `/api/users/:username/following` | Following list |
| PUT | `/api/users/:username/follow` | Follow (idempotent) |
| DELETE | `/api/users/:username/follow` | Unfollow (idempotent) |
| GET | `/api/feed` | Acting user's feed |
| POST | `/api/posts` | Create post |
| GET | `/api/posts/:id` | Post detail with all comments |
| PUT | `/api/posts/:id/like` | Like (idempotent) |
| DELETE | `/api/posts/:id/like` | Unlike (idempotent) |
| POST | `/api/posts/:id/comments` | Add comment |
| POST | `/api/demo/reset` | Restore seed data |

## 10. Resolved decisions

1. Reset is a visible **Reset Demo Data** button in the UI.
2. Limits stay at 500 characters per post and 300 per comment.
3. Data is persisted on the backend (H2 file database), not only in browser storage.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the technical design.
