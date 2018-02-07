import findIndex from 'lodash/findIndex'
import identity from 'lodash/identity'

// Returns a copy of the array containing:
// - the elements which did not matches the predicate
// - the result of the reduction of the elements matching the
//   predicates
//
// As a special case, if the predicate is not provided, it is
// considered to have not matched.
const filterReduce = (array, predicate, reducer, initial) => {
  const { length } = array
  let i
  if (!length || !predicate || (i = findIndex(array, predicate)) === -1) {
    return initial == null ? array.slice(0) : array.concat(initial)
  }

  if (reducer == null) {
    reducer = identity
  }

  const result = array.slice(0, i)
  let value = initial == null ? array[i] : reducer(initial, array[i], i, array)

  for (i = i + 1; i < length; ++i) {
    const current = array[i]
    if (predicate(current, i, array)) {
      value = reducer(value, current, i, array)
    } else {
      result.push(current)
    }
  }

  result.push(value)
  return result
}
export { filterReduce as default }
