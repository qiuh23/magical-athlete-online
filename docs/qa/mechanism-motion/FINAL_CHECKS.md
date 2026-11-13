# Final local checks — 2026-11-13

Baseline: main `1e08851cfe60f156eec59ca25d706f71894e3c34`.
No remote writes or deployment were performed.

| Check | Result |
| --- | --- |
| `node --import tsx --test tests/*.test.ts tests/host.test.mjs` | 1,716 passed, 0 failed, 0 skipped |
| `tsc --noEmit` | Passed, including main/test TypeScript |
| `tsc -p tsconfig.worker.json --noEmit` | Passed |
| `tsc -p qa/tsconfig.motion.json --noEmit` | Passed |
| `node scripts/build-sites.mjs` | Domestic client/server and global browser built |
| `wrangler deploy --dry-run` | Passed; no upload or deployment |
| `git diff --check` | Passed |

The build retains its existing large-chunk warning. The dry run used a temporary
`XDG_CONFIG_HOME` because the default configuration directory was unavailable.
The test runner used Node's `--import tsx` instead of the `tsx` CLI to avoid the
environment's IPC socket restriction. No assertions were skipped for that reason.

Additional mounted-model and geometry checks, their exact finite scope, source
hashes and the browser limitation are recorded in `VERIFICATION.md`,
`verification-summary.json` and `reviewer-coarse-bounds.json`. These checks are
complementary and must not be described as browser/GPU or universal collision
certification.
