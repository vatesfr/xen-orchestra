'use strict'

const { readFile: fs$readFile, realpath } = require('node:fs/promises')

module.exports = function readFile(path) {
  return realpath(path).then(function (path) {
    return fs$readFile(path).then(function (buffer) {
      return {
        path,
        content: buffer,
      }
    })
  })
}
