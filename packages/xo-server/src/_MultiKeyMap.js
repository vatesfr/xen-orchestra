const kValue = Symbol('value')

function del(map, i, n, keys) {
  if (i === n) {
    return map.delete(kValue)
  }
  const key = keys[i]
  const child = map.get(key)
  if (child === undefined) {
    return false
  }
  const deleted = del(child, i + 1, n, keys)
  if (child.size === 0) {
    map.delete(key)
  }
  return deleted
}

function get(map, i, n, keys) {
  if (i === n) {
    return map.get(kValue)
  }
  const child = map.get(keys[i])
  if (child !== undefined) {
    return get(child, i + 1, n, keys)
  }
}

function set(map, i, n, keys, value) {
  if (i === n) {
    return map.set(kValue, value)
  }
  const key = keys[i]
  let child = map.get(key)
  if (child === undefined) {
    map.set(key, (child = new Map()))
  }
  set(child, i + 1, n, keys, value)
}

export default class MultiKeyMap {
  constructor() {
    this._map = new Map()
  }

  delete(keys) {
    return del(this._map, 0, keys.length, keys)
  }

  get(keys) {
    return get(this._map, 0, keys.length, keys)
  }

  set(keys, value) {
    set(this._map, 0, keys.length, keys, value)
    return this
  }
}
