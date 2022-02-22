'use strict'

const MASK = 0x80

exports.set = (map, bit) => {
  map[bit >> 3] |= MASK >> (bit & 7)
}

exports.test = (map, bit) => ((map[bit >> 3] << (bit & 7)) & MASK) !== 0
