'use strict'

const { resolveVhdAlias } = require('./aliases')
const { VhdDirectory } = require('./Vhd/VhdDirectory.js')
const { VhdFile } = require('./Vhd/VhdFile.js')

exports.openVhd = async function openVhd(handler, path, opts) {
  const resolved = await resolveVhdAlias(handler, path)
  if (!handler.isEncrypted) {
    try {
      return await VhdFile.open(handler, resolved, opts)
    } catch (e) {
      if (e.code !== 'EISDIR') {
        throw e
      }
    }
  }
  // vhd file can't be encrypted, since we can't modify part of a file during merge
  return await VhdDirectory.open(handler, resolved, opts)
}
