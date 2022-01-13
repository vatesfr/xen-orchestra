const { resolveAlias } = require('./_resolveAlias')
const { VhdDirectory } = require('./Vhd/VhdDirectory.js')
const { VhdFile } = require('./Vhd/VhdFile.js')

exports.openVhd = async function openVhd(handler, path, opts) {
  const resolved = await resolveAlias(handler, path)
  try {
    return await VhdFile.open(handler, resolved, opts)
  } catch (e) {
    if (e.code !== 'EISDIR') {
      throw e
    }
    return await VhdDirectory.open(handler, resolved, opts)
  }
}
