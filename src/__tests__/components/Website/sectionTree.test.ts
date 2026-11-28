import {
  countBlocks,
  findPath,
  flattenBlocks,
  getAtPath,
  getFirstProblemId,
  getPathName,
  getProblemIds,
  replaceBlock,
} from '../../../Components/Website/sectionTree'
import { getImageIds } from '../../../Components/Website/SectionEditors'

// Blocks inside rows (specs/010-website-rows).
const tree = [
  { id: 'a', type: 'text' },
  {
    id: 'r',
    type: 'row',
    blocks: [
      { id: 'b', type: 'tile', imageAssetId: 'img-b' },
      { id: 'r2', type: 'row', blocks: [{ id: 'c', type: 'image', assetId: 'img-c' }] },
    ],
  },
]

describe('sectionTree', () => {
  test('walks nested blocks in order and counts them', () => {
    expect(flattenBlocks(tree).map((s) => s.id)).toStrictEqual(['a', 'r', 'b', 'r2', 'c'])
    expect(countBlocks(tree)).toBe(5)
  })

  test('finds a block by its id, however deep', () => {
    expect(findPath(tree, 'a')).toStrictEqual([0])
    expect(findPath(tree, 'c')).toStrictEqual([1, 1, 0])
    expect(findPath(tree, 'nope')).toBeUndefined()
    expect(getAtPath(tree, [1, 1, 0]).id).toBe('c')
    expect(getPathName((i) => `sections[${i}]`, [1, 1, 0])).toBe('sections[1].blocks[1].blocks[0]')
  })

  test('replaces a nested block and keeps the rest', () => {
    const next = replaceBlock(tree, { id: 'c', type: 'image', assetId: 'new' })
    expect(getAtPath(next, [1, 1, 0]).assetId).toBe('new')
    expect(next[0]).toBe(tree[0])
  })

  test('problem ids include the rows above a problem; the first one is the innermost', () => {
    const errors = { 'sections[1].blocks[1].blocks[0].assetId': 'Choose an image.' }
    const top = (i: number) => `sections[${i}]`
    expect(getProblemIds(tree, errors, top)).toStrictEqual(['r', 'r2', 'c'])
    expect(getFirstProblemId(tree, errors, top)).toBe('c')
    expect(getFirstProblemId(tree, { 'sections[1].blocks': 'Add a block.' }, top)).toBe('r')
    expect(getFirstProblemId(tree, {}, top)).toBeUndefined()
  })

  test('image ids are found inside rows, even in a row inside a row', () => {
    expect(getImageIds(tree)).toStrictEqual(['img-b', 'img-c'])
  })
})
