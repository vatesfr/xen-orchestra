const Vhd = require('vhd-lib').default

exports.checkVhd = async function checkVhd(handler, path) {
  await new Vhd(handler, path).readHeaderAndFooter()
}
