import Vhd from 'vhd-lib'

export async function checkVhd(handler, path) {
  await new Vhd(handler, path).readHeaderAndFooter()
}
