import { responsiveArray } from 'antd/es/_util/responsiveObserver'
import { vi } from 'vitest'
import { ARTICLE_LIST_GRID } from '../../../Components/Article/ArticleList'
import { VISIT_STATS_GRID } from '../../../Components/Stats/VisitStats'

vi.mock('@ant-design/charts', () => ({ Pie: () => null, Line: () => null }))

// antd sizes a grid list's items only for breakpoints the grid names. A missing one (antd 6 added xxxl)
// leaves every card as wide as its content on that screen size.
test.each([
  ['articles', ARTICLE_LIST_GRID],
  ['visit stats', VISIT_STATS_GRID],
])('the %s grid sets a column count for every antd breakpoint', (_name, grid) => {
  for (const breakpoint of responsiveArray) {
    expect(grid[breakpoint], breakpoint).toEqual(expect.any(Number))
  }
})
