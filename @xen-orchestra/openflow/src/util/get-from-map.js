import assert from 'assert'

export default function get(map, key, errorMsg = undefined) {
  const value = map[String(key)]
  assert.notStrictEqual(value, undefined, errorMsg !== undefined ? errorMsg : `${key} is invalid`)
  return value
}
