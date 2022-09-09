'use strict'

const { resolveVhdAlias } = require('./aliases')
const { VhdDirectory } = require('./Vhd/VhdDirectory.js')
const { VhdFile } = require('./Vhd/VhdFile.js')

exports.openVhd = async function openVhd(handler, path, opts) {
  const resolved = await resolveVhdAlias(handler, path)
  try {
    return await VhdFile.open(handler, resolved, opts)
  } catch (e) {
    // if the remote is encrypted, trying to open a VhdFile will throw an assertion error before checking if the path is a directory, therefore we should try to open a VhdDirectory anyway.
    if (e.code !== 'EISDIR' && e.code !== 'ERR_ASSERTION') {
      throw e
    }
    return await VhdDirectory.open(handler, resolved, opts)
  }
}
