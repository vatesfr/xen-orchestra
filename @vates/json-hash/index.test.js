const { jsonHash } = require('@vates/json-hash')
const assert = require('node:assert/strict')
const test = require('test')

const cases = [
  [null, 'dCNOmK/nSY+12vHzasLXiswzlGT5UHA7jAGYkvmCuQs='],
  [42, 'c0dctApWjo2ooEXO0RATfhWfiQrE2og7axfcZRs6gEk='],
  ['foo', 'siEyldVkkW+JpqQkVVZ8h8P0gPzXocFeIg8X1xaaeQs='],
  [[], 'T1PNoYwrqgwDVLtfmj7L5e0Sq02OEbqHPC8RFhICuUU='],
  [{}, 'RBNvo1WzZ4oRRq0W9+hknpT7T8If536DEMBg9hyq/4o='],
  [{ a: 1, b: 2 }, 'LMjVxyj2vtMZ3W1cZ2cJrQij5zn7FBOlPiyBB38OmFE='],
  [{ b: 2, a: 1 }, 'LMjVxyj2vtMZ3W1cZ2cJrQij5zn7FBOlPiyBB38OmFE='],
]

for (const [value, hash] of cases) {
  test(JSON.stringify(value), function () {
    assert.equal(jsonHash(value), hash)
  })
}
