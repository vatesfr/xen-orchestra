'use strict'

const { test } = require('node:test')

const { createFooter } = require('./_createFooterHeader')

test('createFooter() does not crash', () => {
  createFooter(104448, Math.floor(Date.now() / 1000), {
    cylinders: 3,
    heads: 4,
    sectorsPerTrack: 17,
  })
})
