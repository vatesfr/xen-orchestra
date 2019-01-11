import Vhd from './vhd'
import resolveRelativeFromFile from './_resolveRelativeFromFile'
import { DISK_TYPE_DYNAMIC } from './_constants'

export default async function checkChain(handler, path) {
  while (true) {
    const vhd = new Vhd(handler, path)
    await vhd.readHeaderAndFooter()

    if (vhd.footer.diskType === DISK_TYPE_DYNAMIC) {
      break
    }

    path = resolveRelativeFromFile(path, vhd.header.parentUnicodeName)
  }
}
