# Performance Baselines and Results

Lighthouse default mobile profile unless noted (FR-014, FR-015).

| Journey | Profile | Before | After | Date |
|---------|---------|--------|-------|------|
| Sign-in first-load JS, gzipped, Create React App | Build output | 771 KB | | 2026-10-31 |
| Sign-in first-load JS, gzipped, Vite, no on-demand loading yet | Build output | 761 KB | | 2026-10-31 |
| Production build time | Local | 42s | about 1s | 2026-10-31 |

## On-demand loading (T114)

Sign-in first-load JS is the sum of Vite's own gzip figure for every script and `modulepreload` in `build/index.html`, in kB of 1,000 bytes. The target is 308 kB at most. Each row adds to the one before.

| Change | First-load JS, gzipped |
|--------|------------------------|
| None, `a5033d0` | 1,018.9 kB |
| Pages load on demand | 356.7 kB |
| One copy of moment, not two | 335.9 kB |
| WeChat QR form on demand, sign-in imports its icons by name | 313.6 kB |
| In-WeChat login button on demand | 306.1 kB |
| In-WeChat automatic sign-in, on demand | 307.4 kB |
| Password recovery and the no-company notice, on demand, with first-load code in one chunk | 303.3 kB |
| Session expiry and the 413 and 429 messages in `AppService` | 303.5 kB |
| Company invites: pages on demand, messages and the no-company notice's session field in first load | 304.7 kB |
| Comments: toggle and hide and reply controls on demand, messages in first load | 301.7 kB |
| Links to a comment: company choice in first load, scrolling on demand | 302.1 kB |

Measured and not changed:

| Option | Result |
|--------|--------|
| Import charts from `@ant-design/plots`, not `@ant-design/charts` | No gain: the charts chunk was 401.6 kB and became 402.1 kB. The graphs code was already tree-shaken out |
| Load `BackendPage` eagerly | 387.0 kB, over the target, so it loads with the pages |
| Load the charts on demand in the article editor | Not done: a reload for a stale chunk would discard unsaved edits |

Without the one chunk the same code measured 311.0 kB: each new on-demand page cut the first-load chunks into more, worse-compressing pieces.

Prefetching the dashboard was not tried, because nothing here measured a need for it.
