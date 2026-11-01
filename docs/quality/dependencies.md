# Dependency Compatibility Record

One row per package changed or left below latest (FR-038). A review date is required for anything below latest.

| Package | Start | Final | Node 26 | Action | Reason below latest | Review date |
|---------|-------|-------|---------|--------|---------------------|-------------|
| react-scripts | 5.0.1 | removed | n/a | Replaced by Vite 8 | | |
| momment | 0.0.1 | removed | n/a | Empty placeholder package, never imported | | |
| moment | undeclared | 2.31.0 | Yes | Declared directly; the code imports it | | |
| @ant-design/charts | 1.4.2 | 2.6.7 | Yes | Upgraded |  |  |
| @ant-design/icons | 4.0.0 | 6.3.4 | Yes | Upgraded |  |  |
| @eslint/js | 8.36.0 | 9.39.5 | Yes | Upgraded | Has to match ESLint | 2026-12-31 |
| @fortawesome/fontawesome-svg-core | 6.3.0 | 7.3.1 | Yes | Upgraded |  |  |
| @fortawesome/free-brands-svg-icons | 6.3.0 | 7.3.1 | Yes | Upgraded |  |  |
| @fortawesome/free-solid-svg-icons | 6.3.0 | 7.3.1 | Yes | Upgraded |  |  |
| @fortawesome/react-fontawesome | 0.2.0 | 3.5.0 | Yes | Upgraded |  |  |
| @reduxjs/toolkit | 1.9.3 | 2.13.0 | Yes | Upgraded |  |  |
| @tinymce/tinymce-react | 4.3.0 | 6.3.1 | Yes | Upgraded |  |  |
| @types/big.js | 6.1.6 | 7.0.0 | Yes | Upgraded |  |  |
| @types/lodash | 4.14.191 | 4.17.27 | Yes | Upgraded |  |  |
| @types/node | 16.18.14 | 26.6.6 | Yes | Upgraded |  |  |
| @types/react | 18.0.28 | 19.3.0 | Yes | Upgraded |  |  |
| @types/react-dom | 18.0.11 | 19.3.0 | Yes | Upgraded |  |  |
| @types/styled-components | 5.1.26 | removed | n/a | styled-components 6 has its own types | | |
| @typescript-eslint/eslint-plugin | 5.55.0 | removed | n/a | Replaced by the `typescript-eslint` package | | |
| @typescript-eslint/parser | 5.55.0 | removed | n/a | Replaced by the `typescript-eslint` package | | |
| antd | 5.3.0 | 6.6.8 | Yes | Upgraded |  |  |
| axios | 1.3.4 | 1.21.0 | Yes | Upgraded |  |  |
| big.js | 6.2.1 | 7.0.1 | Yes | Upgraded |  |  |
| eslint | 8.36.0 | 9.39.5 | Yes | Upgraded | `eslint-plugin-react` 7.37.5 allows ESLint up to 9, and crashes on 10 (`getFilename is not a function`) | 2026-12-31 |
| eslint-config-prettier | 8.7.0 | 10.1.8 | Yes | Upgraded |  |  |
| eslint-import-resolver-typescript | 3.5.3 | removed | n/a | Only served `eslint-plugin-import` | | |
| eslint-plugin-import | 2.27.5 | removed | n/a | Never enabled in the config, and limits ESLint | | |
| eslint-plugin-prettier | 4.2.1 | removed | n/a | No rule enabled | | |
| eslint-plugin-react | 7.32.2 | 7.37.5 | Yes | Upgraded |  |  |
| eslint-plugin-react-hooks | 4.6.0 | 7.1.1 | Yes | Upgraded |  |  |
| husky | 8.0.3 | 9.1.7 | Yes | Upgraded |  |  |
| lint-staged | 13.1.2 | 17.6.0 | Yes | Upgraded |  |  |
| lodash | 4.17.21 | 4.18.1 | Yes | Upgraded |  |  |
| moment-timezone | 0.5.41 | 0.6.6 | Yes | Upgraded |  |  |
| prettier | 2.8.4 | 3.9.10 | Yes | Upgraded |  |  |
| qrcode.react | 3.1.0 | 4.2.0 | Yes | Upgraded |  |  |
| react | 18.2.0 | 19.3.1 | Yes | Upgraded |  |  |
| react-dom | 18.2.0 | 19.3.1 | Yes | Upgraded |  |  |
| react-intl | 6.2.10 | 12.1.6 | Yes | Upgraded |  |  |
| react-redux | 8.0.5 | 9.3.1 | Yes | Upgraded |  |  |
| react-router-dom | 6.8.2 | 7.18.5 | Yes | Upgraded |  |  |
| styled-components | 5.3.8 | 6.6.0 | Yes | Upgraded |  |  |
| typescript | 4.9.5 | 6.0.3 | Yes | Upgraded | Stop at 6.0: `typescript-eslint` 8.72 needs below 6.1, while 7.0 is out | 2026-12-31 |
| typescript-eslint | new | 8.72.1 | Yes | Added |  |  |
| web-vitals | 2.1.4 | 6.2.3 | Yes | Upgraded |  |  |
| wechat-jssdk-ts | 1.6.0-dev.1 | removed | n/a | Replaced by WeChat's official script (T097) | | |

## Admin notes

- TinyMCE: the wrapper is on 6, but the editor itself stays on cloud channel 6 through `cloudChannel`, which is what production runs today. The default is now channel 8. Moving needs a test with the real API key, and the plugin list has names that later versions removed. Review by 2026-12-31.
- antd: `List` still works in 6, but is deprecated and goes in the next major. `Collapse.Panel`, `Menu.Item` and `Timeline.Item` are deprecated too.
- Yarn `resolutions` for `form-data` and `@babel/traverse` are removed: the versions they forced are now the normal ones.
- `@playwright/test` is at latest, so `.github/workflows/e2e.yml` keeps its container tag.
- `moment-timezone` and `@fortawesome/free-solid-svg-icons` are upgraded, but no source file imports them.
