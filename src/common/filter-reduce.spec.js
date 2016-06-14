import test from 'ava'

import filterReduce from './filter-reduce'

const add = (a, b) => a + b
const data = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ]
const isEven = x => !(x & 1)

test('filterReduce', t => {
  // Returns all elements not matching the predicate and the result of
  // a reduction over those who do.
  t.deepEqual(
    filterReduce(data, isEven, add),
    [ 1, 3, 5, 7, 9, 20 ]
  )

  // The default reducer is the identity.
  t.deepEqual(
    filterReduce(data, isEven),
    [ 1, 3, 5, 7, 9, 0 ]
  )

  // If an initial value is passed it is used.
  t.deepEqual(
    filterReduce(data, isEven, add, 22),
    [ 1, 3, 5, 7, 9, 42 ]
  )
})
