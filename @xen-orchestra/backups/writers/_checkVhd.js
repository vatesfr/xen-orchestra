const Vhd = require('vhd-lib').VhdFile

exports.checkVhd = async function checkVhd(handler, path) {
  await new Vhd(handler, path).readHeaderAndFooter()
}
