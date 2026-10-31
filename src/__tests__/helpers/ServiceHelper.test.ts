import * as ServiceHelper from '../../Helpers/ServiceHelper'

// These strings go to the API as query operators, so a rename here breaks filtering.
test('operators keep their wire values', () => {
  expect({ ...ServiceHelper }).toEqual({
    OP_AND: 'OP_AND',
    OP_OR: 'OP_OR',
    OP_LIKE: 'OP_LIKE',
    OP_EQ: 'OP_EQ',
    OP_GTE: 'OP_GTE',
    OP_GT: 'OP_GT',
    OP_LT: 'OP_LT',
    OP_LTE: 'OP_LTE',
    OP_NOT: 'OP_NOT',
    OP_BETWEEN: 'OP_BETWEEN',
  })
})
