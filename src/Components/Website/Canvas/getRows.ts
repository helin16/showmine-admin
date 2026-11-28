import { IWebsiteSection } from '../../../Types/Website/IWebsite'

// The Reader's rule (spec 009): two consecutive blocks that both have sideBySide share a row; pairs only, so of three
// in a row the first two pair and the third stands alone. Returns the block positions of each row.
const getRows = (sections: IWebsiteSection[]) => {
  const rows: number[][] = []
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].sideBySide === true && sections[i + 1]?.sideBySide === true) rows.push([i, ++i])
    else rows.push([i])
  }
  return rows
}

export default getRows
