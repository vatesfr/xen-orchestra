export function moveFirst(array, predicate, thisArg) {
  const i = array.findIndex(predicate, thisArg)
  if (i === -1) {
    return false
  }

  if (i !== 0) {
    const item = array[0]
    array[0] = array[i]
    array[i] = item
  }
  return true
}
