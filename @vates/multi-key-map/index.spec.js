/* eslint-env jest */

const { MultiKeyMap } = require('./')

describe('MultiKeyMap', () => {
  it('works', () => {
    const map = new MultiKeyMap()

    const keys = [
      // null key
      [],
      // simple key
      ['foo'],
      // composite key
      ['foo', 'bar'],
      // reverse composite key
      ['bar', 'foo'],
    ]
    const values = keys.map(() => ({}))

    // set all values first to make sure they are all stored and not only the
    // last one
    keys.forEach((key, i) => {
      map.set(key, values[i])
    })

    keys.forEach((key, i) => {
      // copy the key to make sure the array itself is not the key
      expect(map.get(key.slice())).toBe(values[i])
      map.delete(key.slice())
      expect(map.get(key.slice())).toBe(undefined)
    })
  })
})
