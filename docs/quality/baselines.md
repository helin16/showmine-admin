# Performance Baselines and Results

Lighthouse default mobile profile unless noted (FR-014, FR-015).

| Journey | Profile | Before | After | Date |
|---------|---------|--------|-------|------|
| Sign-in first-load JS, gzipped, Create React App | Build output | 771 KB | | 2026-10-31 |
| Sign-in first-load JS, gzipped, Vite, no on-demand loading yet | Build output | 761 KB | | 2026-10-31 |
| Production build time | Local | 42s | about 1s | 2026-10-31 |
| Sign-in page, performance score | Lighthouse mobile, production | 87 | | 2026-11-02 |
| Sign-in page, First Contentful Paint | Lighthouse mobile, production | 1.1 s | | 2026-11-02 |
| Sign-in page, Largest Contentful Paint | Lighthouse mobile, production | 3.2 s | | 2026-11-02 |
| Sign-in page, Speed Index | Lighthouse mobile, production | 2.5 s | | 2026-11-02 |
| Sign-in page, Total Blocking Time | Lighthouse mobile, production | 239 ms | | 2026-11-02 |
| Sign-in page, Cumulative Layout Shift | Lighthouse mobile, production | 0.011 | | 2026-11-02 |
| Sign-in page, total transfer | Lighthouse mobile, production | 464 KB | | 2026-11-02 |
| Sign-in page, Largest Contentful Paint as observed, no throttling | Lighthouse trace, production | 1.4 s | | 2026-11-02 |
| Sign-in first-load JS, Vite gzip figure | Fresh build of `master` | 302.1 kB | | 2026-11-02 |
| Sign-in first-load JS, as transferred | Lighthouse network record, production | 306.2 kB | | 2026-11-02 |

## Production baseline, 2026-11-02

Conditions: measured from an Australian home connection on one Mac, whose speed was not measured. Server location and WeChat users in China differ, so these figures do not describe a visit from China.

Method: `npx lighthouse@13.6.0` with headless Chrome, `--only-categories=performance --skip-audits=bf-cache`, and the default simulated mobile throttling of 150 ms round trip, 1.6 Mbps and 4x CPU slowdown. Each figure is the median of 3 sequential runs of `https://admin.showmine.com/`, taken per metric. Largest Contentful Paint ranged from 3.0 to 3.3 s. The observed figure is Lighthouse's own unthrottled trace, ranging from 0.6 to 1.5 s.

First-load JS stays under the 308 kB target. The transferred figure includes response headers. The build had no `.env`, so its chunk name differs from production's.

Not measured: sign-in to dashboard, article list, media list and statistics. They need a signed-in session, and no sign-in was attempted, so T034 stays open for those journeys.

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
| Company kept per tab | 302.1 kB |

Measured and not changed:

| Option | Result |
|--------|--------|
| Import charts from `@ant-design/plots`, not `@ant-design/charts` | No gain: the charts chunk was 401.6 kB and became 402.1 kB. The graphs code was already tree-shaken out |
| Load `BackendPage` eagerly | 387.0 kB, over the target, so it loads with the pages |
| Load the charts on demand in the article editor | Not done: a reload for a stale chunk would discard unsaved edits |

Without the one chunk the same code measured 311.0 kB: each new on-demand page cut the first-load chunks into more, worse-compressing pieces.

Prefetching the dashboard was not tried, because nothing here measured a need for it.
