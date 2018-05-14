const MASK = 0x80

export const set = (map, bit) => {
  map[bit >> 3] |= MASK >> (bit & 7)
}

export const test = (map, bit) => ((map[bit >> 3] << (bit & 7)) & MASK) !== 0
