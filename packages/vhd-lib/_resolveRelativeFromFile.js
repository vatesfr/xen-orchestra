'use strict'

const { dirname, resolve } = require('path')

const resolveRelativeFromFile = (file, path) => {
  if (file.startsWith('/')) {
    return resolve(dirname(file), path)
  }
  return resolve('/', dirname(file), path).slice(1)
}
module.exports = resolveRelativeFromFile
