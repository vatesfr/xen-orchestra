class Node {
  constructor(value) {
    this.children = new Map()
    this.value = value
  }
}

function del(node, i, n, keys) {
  if (i === n) {
    if (node instanceof Node) {
      node.value = undefined
      return node
    }
    return
  }
  if (!(node instanceof Node)) {
    return node
  }
  const key = keys[i]
  const { children } = node
  const child = children.get(key)
  if (child === undefined) {
    return node
  }
  const newChild = del(child, i + 1, n, keys)
  if (newChild === undefined) {
    if (children.size === 1) {
      return node.value
    }
    children.delete(key)
  } else if (newChild !== child) {
    children.set(key, newChild)
  }
  return node
}

function get(node, i, n, keys) {
  return node instanceof Node
    ? i === n
      ? node.value
      : get(node.children.get(keys[i]), i + 1, n, keys)
    : i === n
    ? node
    : undefined
}

function set(node, i, n, keys, value) {
  if (i === n) {
    if (node instanceof Node) {
      node.value = value
      return node
    }
    return value
  }
  const key = keys[i]
  if (!(node instanceof Node)) {
    node = new Node(node)
    node.children.set(key, set(undefined, i + 1, n, keys, value))
  } else {
    const { children } = node
    const child = children.get(key)
    const newChild = set(child, i + 1, n, keys, value)
    if (newChild !== child) {
      children.set(key, newChild)
    }
  }
  return node
}

export default class MultiKeyMap {
  constructor() {
    // each node is either a value or a Node if it contains children
    this._root = undefined
  }

  delete(keys) {
    this._root = del(this._root, 0, keys.length, keys)
  }

  get(keys) {
    return get(this._root, 0, keys.length, keys)
  }

  set(keys, value) {
    this._root = set(this._root, 0, keys.length, keys, value)
    return this
  }
}
