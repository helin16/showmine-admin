import { IWebsiteSection } from '../../Types/Website/IWebsite'

// Blocks that hold blocks (a row, spec 010): the walks every list of sections needs. A block's id is unique across
// the page, nested blocks included, so a block is found by its id.
export const getBlocks = (section: IWebsiteSection): IWebsiteSection[] =>
  Array.isArray(section.blocks) ? (section.blocks as IWebsiteSection[]) : []

// Every block, rows and the blocks inside them, in order.
export const flattenBlocks = (sections: IWebsiteSection[]): IWebsiteSection[] =>
  sections.flatMap((section) => [section, ...flattenBlocks(getBlocks(section))])

// The page's and the shared list's limits count nested blocks too.
export const countBlocks = (sections: IWebsiteSection[]) => flattenBlocks(sections).length

// Where a block is: its position in the list, then in each row down to it. Undefined when it is not there.
export const findPath = (sections: IWebsiteSection[], id?: string): number[] | undefined => {
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].id === id) return [i]
    const inside = findPath(getBlocks(sections[i]), id)
    if (inside) return [i, ...inside]
  }
  return undefined
}

export const getAtPath = (sections: IWebsiteSection[], path: number[]): IWebsiteSection =>
  path.length === 1 ? sections[path[0]] : getAtPath(getBlocks(sections[path[0]]), path.slice(1))

// The list with the block of this id replaced.
export const replaceBlock = (sections: IWebsiteSection[], changed: IWebsiteSection): IWebsiteSection[] =>
  sections.map((section) =>
    section.id === changed.id
      ? changed
      : Array.isArray(section.blocks)
        ? { ...section, blocks: replaceBlock(getBlocks(section), changed) }
        : section,
  )

// The API's path of a block: the path of its place in the top list, then .blocks[i] for each row down to it.
export const getPathName = (top: (index: number) => string, path: number[]) =>
  top(path[0]) +
  path
    .slice(1)
    .map((i) => `.blocks[${i}]`)
    .join('')

type iErrors = { [path: string]: string }
// The ids of the blocks with a problem in or below them, in order; `top` names a top-level block's path.
export const getProblemIds = (sections: IWebsiteSection[], errors: iErrors, top: (index: number) => string) => {
  const found: string[] = []
  const walk = (list: IWebsiteSection[], name: (index: number) => string) =>
    list.forEach((section, i) => {
      const prefix = `${name(i)}.`
      if (Object.keys(errors).some((path) => path.startsWith(prefix))) found.push(section.id)
      walk(getBlocks(section), (j) => `${name(i)}.blocks[${j}]`)
    })
  walk(sections, top)
  return found
}

// The first block with a problem, and the innermost one when the problem is in a row's block.
export const getFirstProblemId = (sections: IWebsiteSection[], errors: iErrors, top: (index: number) => string) => {
  const ids = getProblemIds(sections, errors, top)
  let id = ids[0]
  for (;;) {
    const inner = getBlocks(flattenBlocks(sections).find((s) => s.id === id) || ({} as IWebsiteSection)).find((s) =>
      ids.includes(s.id),
    )
    if (!inner) return id
    id = inner.id
  }
}
