'use strict'

const openVhd = require('vhd-lib').openVhd
const Disposable = require('promise-toolbox/Disposable')

exports.checkVhd = async function checkVhd(handler, path) {
  await Disposable.use(openVhd(handler, path), () => {})
}
