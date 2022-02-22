'use strict'

const { openVhd } = require('./openVhd')
const resolveRelativeFromFile = require('./_resolveRelativeFromFile')
const { DISK_TYPES } = require('./_constants')
const { Disposable } = require('promise-toolbox')

module.exports = async function checkChain(handler, path) {
  await Disposable.use(function* () {
    let vhd
    do {
      vhd = yield openVhd(handler, path)
      path = resolveRelativeFromFile(path, vhd.header.parentUnicodeName)
    } while (vhd.footer.diskType !== DISK_TYPES.DYNAMIC)
  })
}
