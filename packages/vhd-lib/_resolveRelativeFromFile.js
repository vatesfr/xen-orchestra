'use strict'

const { dirname, resolve } = require('path')

const resolveRelativeFromFile = (file, path) => resolve('/', dirname(file), path).slice(1)

module.exports = resolveRelativeFromFile
