# Lobby navigation and visuals — 2026-11-05

Captured from the real local static lobby in Edge headless. These show the Cloudflare page with domestic HTTPS disabled; they are not production screenshots or domestic TLS acceptance evidence.

- [Desktop, 1440 × 1000 viewport](desktop.png)
- [Mobile, 390 × 844 viewport](mobile.png), full page capture

Also visually inspected 320 × 720 and 667 × 375 landscape captures in `.local/`.
The six `tests/browser/lobby.spec.ts` cases verify both trusted lobby URLs, all four game entry navigations, invitation roles, unavailable domestic entries, reloads, resource MIME/content, keyboard activation and reduced motion. Official-shaped URLs are intercepted by local fixtures, so these tests do not assert that unlaunched public HTTPS domains work.

Deployment evidence, actual local game/WebSocket checks, rollout and rollback are recorded in [the deployment audit](../../lobby-deployment-audit-2026-11-05.md).
