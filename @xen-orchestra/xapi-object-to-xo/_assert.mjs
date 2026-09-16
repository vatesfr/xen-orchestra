// Browser shim for `node:assert/strict` — only the two forms _xoData.mjs uses.

const assert = (value, message = 'assertion failed') => {
  if (!value) {
    throw new Error(message)
  }
}

assert.equal = (actual, expected) => {
  if (actual !== expected) {
    throw new Error(`expected ${String(expected)}, got ${String(actual)}`)
  }
}

export default assert
