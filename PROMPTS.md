# Prompts

The exact prompts used to build this project with Claude Code, in the order they were
sent. They are copied verbatim, unedited, and each sits in a code block so its formatting
is preserved. All of them were sent in a single Claude Code session (cloud environment),
on the branch `claude/happy-dijkstra-msb5bu`.

No other prompts were sent in that session: no separate debugging or refinement prompts.
Bugs found along the way (for example a blank-page crash caught by the browser tests, and
mobile layout problems seen in screenshots) were fixed within the stage that found them,
under that stage's prompt.

| # | Stage | Main output |
|---|---|---|
| 1 | Requirements | `REQUIREMENTS.md` |
| 2 | Architecture | `ARCHITECTURE.md` |
| 3 | Backend | `backend/` and its tests |
| 4 | Frontend | `frontend/` and its tests |
| 5 | Preview question | No code changes |
| 6 | Browser tests and screenshots | `frontend/e2e/`, `docs/screenshots/` |
| 7 | Submission preparation | `PROMPTS.md`, README polish, docs check |
| 8 | Demo video | `docs/demo/`, `frontend/e2e/demo.spec.ts` |
| 9 | Inline video in README | Blocked; see outcome below |

## 1. Requirements

```text
Design a small Instagram-like social media MVP with three features: creating text posts, liking and commenting on posts, and following/unfollowing users. Include three demo users and a chronological feed. No authentication or image uploads. Define functional requirements, edge cases, and acceptance criteria. Save them in REQUIREMENTS.md. Do not implement code yet.
```

## 2. Architecture

```text
Using REQUIREMENTS.md, design the architecture for this application.
Use Java 17, Spring Boot, H2 file-based database, and React with TypeScript. Keep it a modular monolith with REST APIs.
Define the database schema, API endpoints, component interactions, and feed retrieval logic. Include a simple architecture diagram using Mermaid.
Resolve the open questions as follows:

* Provide a visible "Reset Demo Data" button.
* Keep the 500-character post and 300-character comment limits.
* Persist data on the backend, not only in browser storage.

Save the design in ARCHITECTURE.md. Keep it concise and practical for a locally runnable MVP.
Do not implement application code yet.
```

## 3. Backend implementation

```text
Implement the Spring Boot backend described in REQUIREMENTS.md and ARCHITECTURE.md.

Use Java 17, Spring Boot, Spring Data JPA, file-based H2, and Flyway migrations.

Implement all documented REST APIs for users, posts, likes, comments, follows, feed, and demo reset. Include the three seeded users and sample data.

Enforce validation, uniqueness, and consistent error responses. Add automated backend tests covering the main workflows and edge cases.

Keep the architecture modular and follow the existing design documents. Do not build the frontend yet.

Run the tests, fix any failures, and report the results. Commit and push the changes to the current branch.
```

## 4. Frontend implementation

```text
Implement the React + TypeScript frontend using Vite, following REQUIREMENTS.md and ARCHITECTURE.md.
Build a clean, responsive Instagram-inspired interface with:

* A demo-user switcher for alice, bob and carol.
* A chronological feed with posts, likes and comments.
* A form to create posts.
* Follow/unfollow controls and user profiles.
* A confirmation-based "Reset Demo Data" button.

Connect all features to the existing Spring Boot REST APIs. Use the documented acting-user header and Vite's /api proxy.
Include loading states, error handling, input validation and accessible controls. Keep the interface simple, polished and usable on mobile.
Do not change the backend unless necessary to fix an integration issue.
Install dependencies, run the frontend build and any available checks, fix errors, then commit and push to the current branch. Report what works and what remains unverified.
```

## 5. Preview URL question

```text
The application is running in Claude Code's cloud environment, not on my Mac.

I want to open the working application in my own browser and test it personally.

Can you provide an externally accessible preview URL for the running frontend and backend? If this cloud environment cannot expose one, tell me that clearly.

Do not make code changes yet.
```

Outcome: the cloud environment cannot accept inbound connections, so no preview URL was
possible. Local run instructions were given instead (now in the README).

## 6. Browser tests and screenshots

```text
Save the existing Playwright end-to-end browser test script in the repository so it can be rerun.

Add a documented command to execute it against the Spring Boot backend and Vite frontend.

Run the browser tests again and save representative screenshots in docs/screenshots/ showing the feed, post creation, likes/comments, profiles, follow/unfollow, mobile layout, and reset dialog.

Use actual screenshots from the running application, not mockups. Ensure screenshots contain only demo data.

Update README.md with the test command and a screenshots section.

Run the relevant checks, then commit and push everything to the current branch. Report the results.
```

## 7. Submission preparation

```text
Prepare the repository for final interview submission.

1. Create PROMPTS.md containing the exact verbatim prompts used for every stage, in chronological order. Include any additional prompts used for debugging or refinement. Do not paraphrase or invent prompts. If any original prompt is unavailable, mark it as missing and ask me for it.
2. Polish README.md with:

* Project overview and implemented features
* Technology stack and architecture
* Key engineering decisions and tradeoffs
* Local setup and run instructions
* Automated test commands and verified results
* Screenshots from docs/screenshots/
* Known limitations and future improvements
* A placeholder for a demo recording

3. Verify that all documentation matches the actual implementation and that no secrets, local databases, or generated build artifacts are committed.
4. Run the final checks, commit and push to the current branch.

Do not merge into main yet. Report any missing information or blockers.
```

## 8. Demo video

```text
Create a short, polished video walkthrough of the working Instagram-like application using Playwright and Chromium in this cloud environment.
Record a real browser session against the running Spring Boot backend and React frontend, demonstrating:

1. The home feed with seeded posts.
2. Switching between demo users.
3. Creating a new post.
4. Liking and commenting on a post.
5. Following another user and seeing their posts appear in the feed.
6. Refreshing the page to demonstrate persistence.
7. The Reset Demo Data confirmation and reset.

Use visible mouse interactions and natural pauses so the recording is easy to follow. Aim for 60–90 seconds.
Use only demo data. Do not generate a simulated or animated mockup.
Save the recording under docs/demo/ in a GitHub-friendly format, preferably MP4. If MP4 conversion is unavailable, use Playwright's WebM recording format.
Update README.md to link to the actual recording and briefly describe what it demonstrates.
Keep the recording reasonably small for GitHub. Verify that it plays correctly and that the application is visible throughout.
Run the relevant checks, commit and push to the current branch.
Report the video filename, duration, size, verification results, and any limitations. Do not merge into main yet.
```

## 9. Inline video in the README

```text
Make the demo walkthrough video play inline in the GitHub README instead of appearing as a downloadable repository file.

Use GitHub's video attachment feature to upload docs/demo/instaclone-walkthrough.mp4 and obtain a GitHub-hosted user-attachments URL.

If the installed GitHub CLI supports it, use the video attachment functionality on an existing issue or pull request. Do not create unnecessary issues or pull requests.

Update the README Demo Walkthrough section to place the resulting video attachment URL on its own line so GitHub renders a player.

Keep the original MP4 in docs/demo/ as well.

Verify that the rendered README displays an inline playable video, not merely a download link. If GitHub permissions or tooling prevent this, explain the blocker instead of guessing a URL.

Append this prompt verbatim to PROMPTS.md, commit and push to the current branch. Do not merge into main yet.
```

Outcome: blocked, so the README was left unchanged. GitHub only issues `user-attachments`
URLs when a file is dropped into a comment or editor in the web interface; there is no
API for it, and the GitHub CLI (2.89.0) has no attachment command. The repository also
had no issues or pull requests to attach to. The upload has to be done by hand in the
GitHub web UI.
