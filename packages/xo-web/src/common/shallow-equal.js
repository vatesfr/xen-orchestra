import kindOf from 'kindof'

// Tests that two collections (arrays, sets or objects) have strictly equals
// values (items or properties)
const shallowEqual = (c1, c2) => {
  if (c1 === c2) {
    return true
  }

  const type = kindOf(c1)
  if (type !== kindOf(c2)) {
    return false
  }

  if (type === 'array') {
    const { length } = c1
    if (length !== c2.length) {
      return false
    }

    for (let i = 0; i < length; ++i) {
      if (c1[i] !== c2[i]) {
        return false
      }
    }

    return true
  }

  if (type === 'set') {
    if (c1.size !== c2.size) {
      return false
    }

    for (const v of c1) {
      if (!c2.has(v)) {
        return false
      }
    }

    return true
  }

  if (type !== 'object') {
    return false
  }

  let n = 0
  // eslint-disable-next-line no-unused-vars
  for (const _ in c2) {
    ++n
  }

  for (const key in c1) {
    if (c1[key] !== c2[key]) {
      return false
    }
    --n
  }

  return !n
}
export { shallowEqual as default }
