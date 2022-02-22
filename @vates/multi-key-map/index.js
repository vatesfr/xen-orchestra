'use strict'

class Node {
  constructor(value) {
    this.children = new Map()
    this.value = value
  }
}

function del(node, i, keys) {
  if (i === keys.length) {
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
  const newChild = del(child, i + 1, keys)
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

function get(node, i, keys) {
  return i === keys.length
    ? node instanceof Node
      ? node.value
      : node
    : node instanceof Node
    ? get(node.children.get(keys[i]), i + 1, keys)
    : undefined
}

function set(node, i, keys, value) {
  if (i === keys.length) {
    if (node instanceof Node) {
      node.value = value
      return node
    }
    return value
  }
  const key = keys[i]
  if (!(node instanceof Node)) {
    node = new Node(node)
    node.children.set(key, set(undefined, i + 1, keys, value))
  } else {
    const { children } = node
    const child = children.get(key)
    const newChild = set(child, i + 1, keys, value)
    if (newChild !== child) {
      children.set(key, newChild)
    }
  }
  return node
}

exports.MultiKeyMap = class MultiKeyMap {
  constructor() {
    // each node is either a value or a Node if it contains children
    this._root = undefined
  }

  delete(keys) {
    this._root = del(this._root, 0, keys)
  }

  get(keys) {
    return get(this._root, 0, keys)
  }

  set(keys, value) {
    this._root = set(this._root, 0, keys, value)
  }
}
