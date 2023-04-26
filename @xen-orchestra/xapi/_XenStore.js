'use strict'

const fromCallback = require('promise-toolbox/fromCallback')
const { execFile } = require('node:child_process')

exports.getCurrentVmUuid = async function getCurrentVmUuid() {
  const vm = (await read('vm')).trim()
  const i = vm.lastIndexOf('/')
  if (i === -1) {
    throw new Error('incorrect XenStore VM entry: ' + vm)
  }
  return vm.slice(i + 1)
}

const read = key => fromCallback(execFile, 'xenstore-read', [key])
