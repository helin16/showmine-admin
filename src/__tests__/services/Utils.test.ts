import Utils from '../../Services/Utils'

describe('camelcase', () => {
  test.each([
    ['foo bar-baz', 'fooBarBaz'],
    ['already', 'already'],
    ['trailing-', 'trailing-'],
    ['', ''],
  ])('%s becomes %s', (input, expected) => {
    expect(Utils.camelcase(input)).toBe(expected)
  })
})

describe('validateEmailFormat', () => {
  test.each([
    ['a@b.co', true],
    ['first.last+tag@sub.example.com', true],
    ['a@localhost', true],
    ['', false],
    ['a.example.com', false],
    ['a@', false],
    ['@b.co', false],
    ['a b@c.co', false],
  ])('%s is %s', (input, expected) => {
    expect(Utils.validateEmailFormat(input)).toBe(expected)
  })
})

describe('validateUrl', () => {
  test.each([
    ['example.com', true],
    ['http://example.com', true],
    ['https://www.example.com/a?b=1', true],
    ['https://sub-domain.example.com:8080/', true],
    ['', false],
    ['localhost', false],
    ['ftp://example.com', false],
    ['https://example', false],
    ['example.c', false],
    ['exa mple.com', false],
  ])('%s is %s', (input, expected) => {
    expect(Utils.validateUrl(input)).toBe(expected)
  })
})

describe('groupArrayByKey', () => {
  test('groups rows and keeps their order', () => {
    const [a, b, c] = [
      { id: 1, t: 'x' },
      { id: 2, t: 'y' },
      { id: 3, t: 'x' },
    ]
    expect(Utils.groupArrayByKey([a, b, c], 't')).toEqual({ x: [a, c], y: [b] })
  })

  test('an empty array gives an empty object', () => {
    expect(Utils.groupArrayByKey([], 't')).toEqual({})
  })
})

describe('convertArrayToObject', () => {
  test('indexes rows by key, the last duplicate winning', () => {
    const [a, b, c] = [
      { id: 'x', n: 1 },
      { id: 'y', n: 2 },
      { id: 'x', n: 3 },
    ]
    expect(Utils.convertArrayToObject([a, b, c], 'id')).toEqual({ x: c, y: b })
  })

  test('an empty array gives an empty object', () => {
    expect(Utils.convertArrayToObject([], 'id')).toEqual({})
  })
})

describe('translateChannelType', () => {
  test.each([
    ['groupmessage', 'WeChat Group'],
    ['singlemessage', 'WeChat User'],
    ['timeline', 'WeChat Moments'],
    ['Facebook', 'Facebook'],
    ['', ''],
  ])('%s becomes %s', (input, expected) => {
    expect(Utils.translateChannelType(input)).toBe(expected)
  })
})

describe('stripHTMLTags', () => {
  test.each([
    ['<p>hello <b>world</b></p>', 'hello world'],
    ['<a href="x">link</a>', 'link'],
    ['plain', 'plain'],
    ['', ''],
  ])('%s becomes %s', (input, expected) => {
    expect(Utils.stripHTMLTags(input)).toBe(expected)
  })
})

describe('formatCurrency', () => {
  test.each([
    [0, undefined, '0.00'],
    [999, undefined, '999.00'],
    [1000, undefined, '1,000.00'],
    [1234567.891, undefined, '1,234,567.89'],
    [-1234.5, undefined, '-1,234.50'],
    [1234.5, 3, '1,234.500'],
  ])('formatCurrency(%d, %s) is %s', (value, decimals, expected) => {
    expect(Utils.formatCurrency(value, decimals)).toBe(expected)
  })

  // KNOWN BUG: the separator regex needs a decimal point, so whole numbers get no commas. Remove .fails once fixed.
  test.fails('adds separators when there are no decimals', () => {
    expect(Utils.formatCurrency(1234567, 0)).toBe('1,234,567')
  })
})

describe('concatIRestList', () => {
  const first = { data: [1], total: 2, perPage: 1, currentPage: 1, from: 1, to: 1, pages: 2 }
  const second = { ...first, data: [2], currentPage: 2, from: 2, to: 2 }

  test('appends rows and takes paging from the new page', () => {
    expect(Utils.concatIRestList(first, second)).toEqual({ ...second, data: [1, 2] })
  })

  test('does not change the original list', () => {
    Utils.concatIRestList(first, second)
    expect(first.data).toEqual([1])
  })
})

describe('compareArrays', () => {
  test.each([
    [undefined, undefined, true],
    [undefined, [], false],
    [['a'], undefined, false],
    [[], [], true],
    [['a', 'b'], ['b', 'a'], true],
    [['a', 'b'], ['a'], false],
    [['a', 'b'], ['a', 'c'], false],
  ])('%j and %j is %s', (left, right, expected) => {
    expect(Utils.compareArrays(left, right)).toBe(expected)
  })

  test('the same array equals itself', () => {
    const list = ['b', 'a']
    expect(Utils.compareArrays(list, list)).toBe(true)
  })

  // KNOWN BUG: it sorts its inputs in place. Remove .fails once fixed.
  test.fails('leaves its inputs in their original order', () => {
    const list = ['b', 'a']
    Utils.compareArrays(list, ['a', 'b'])
    expect(list).toEqual(['b', 'a'])
  })

  // KNOWN BUG: it compares joined strings, so a comma inside a value collides. Remove .fails once fixed.
  test.fails('tells a value containing a comma from two values', () => {
    expect(Utils.compareArrays(['a,b'], ['a', 'b'])).toBe(false)
  })
})

describe('getUrlParameter', () => {
  afterEach(() => {
    window.history.replaceState(null, '', '/')
  })

  test.each([
    ['?a=1&b=2', 'b', '2'],
    ['?q=two+words', 'q', 'two words'],
    ['?q=%E4%B8%AD', 'q', '中'],
    ['?a[0]=x', 'a[0]', 'x'],
    ['?a=1', 'missing', ''],
    ['?a=', 'a', ''],
    ['', 'a', ''],
  ])('in "%s" %s is "%s"', (search, name, expected) => {
    window.history.replaceState(null, '', `/${search}`)
    expect(Utils.getUrlParameter(name)).toBe(expected)
  })
})

describe('isJSON', () => {
  test.each(['{"a":1}', '[]', '{}', '"text"', '1', 'true'])('%s is JSON', (input) => {
    expect(Utils.isJSON(input)).toBe(true)
  })

  test.each(['', 'not json', '{a:1}', '{"a":1'])('"%s" is not JSON', (input) => {
    expect(Utils.isJSON(input)).toBe(false)
  })

  // KNOWN BUG: it tests the parsed value's truthiness, so valid falsy JSON is rejected. Remove .fails once fixed.
  test.fails.each(['0', 'false', 'null', '""'])('%s is JSON', (input) => {
    expect(Utils.isJSON(input)).toBe(true)
  })
})
