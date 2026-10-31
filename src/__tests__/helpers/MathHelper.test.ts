import MathHelper from '../../Helpers/MathHelper'

describe('MathHelper', () => {
  test.each([
    ['add', 0.1, 0.2, 0.3],
    ['add', -1.5, 1.5, 0],
    ['sub', 0.3, 0.1, 0.2],
    ['sub', 1, 2.5, -1.5],
    ['mul', 0.1, 0.2, 0.02],
    ['mul', 3, 0, 0],
    ['div', 0.3, 0.1, 3],
    ['div', 0, 5, 0],
  ] as const)('%s(%d, %d) is exactly %d', (op, left, right, expected) => {
    expect(MathHelper[op](left, right)).toBe(expected)
  })

  test('dividing by zero throws', () => {
    expect(() => MathHelper.div(1, 0)).toThrow('Division by zero')
  })

  test.each(['add', 'sub', 'mul', 'div'] as const)('%s throws on NaN', (op) => {
    expect(() => MathHelper[op](NaN, 1)).toThrow('Invalid number')
  })
})
