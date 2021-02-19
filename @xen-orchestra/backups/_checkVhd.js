const Vhd = require('vhd-lib').default

async function checkVhd(handler, path) {
  await new Vhd(handler, path).readHeaderAndFooter()
}

exports.checkVhd = checkVhd
