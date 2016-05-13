// Tests that two collections (arrays or objects) have strictly equals
// values (items or properties)
const shallowEqual = (c1, c2) => {
  if (c1 === c2) {
    return true
  }

  const type = typeof c1
  if (type !== typeof c2) {
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

  let n = 0
  for (const _ in c2) { // eslint-disable-line no-unused-vars
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
