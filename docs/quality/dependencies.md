# Dependency Compatibility Record

One row per package changed or left below latest (FR-038). A review date is required for anything below latest.

| Package | Start | Final | Node 26 | Action | Reason below latest | Review date |
|---------|-------|-------|---------|--------|---------------------|-------------|
| react-scripts | 5.0.1 | removed | n/a | Replaced by Vite 8 | | |
| momment | 0.0.1 | removed | n/a | Empty placeholder package, never imported | | |
| moment | undeclared | 2.29.4 | Yes | Declared directly; the code imports it | Major review in Stage D | 2026-12-31 |
