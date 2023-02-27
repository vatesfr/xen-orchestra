function splitKey(key) {
  return Array.isArray(key) ? [key[0], key.length < 2 ? undefined : key.slice(1)] : [key, undefined]
}

export class TreeMap extends Map {
  delete(key) {
    const [head, tail] = splitKey(key)

    if (tail === undefined) {
      return super.delete(head)
    }

    const value = super.get(head)
    if (value instanceof TreeMap) {
      if (value.delete(tail)) {
        if (value.size === 0) {
          return super.delete(head)
        }
      }
    }
    return false
  }

  get(key) {
    const [head, tail] = splitKey(key)

    const value = super.get(head)
    if (tail === undefined) {
      return value
    }

    if (value instanceof TreeMap) {
      return value.get(tail)
    }
  }

  has(key) {
    const [head, tail] = splitKey(key)

    if (!super.has(head)) {
      return false
    }
    if (tail === undefined) {
      return true
    }

    const value = super.get(head)
    return value instanceof TreeMap && value.has(tail)
  }

  set(key, value) {
    const [head, tail] = splitKey(key)

    if (tail === undefined) {
      return super.set(head, value)
    }

    let map = super.get(head)
    if (!(map instanceof TreeMap)) {
      map = new TreeMap()
      super.set(head, map)
    }
    map.set(tail, value)
    return this
  }
}
