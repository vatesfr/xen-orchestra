import Vhd from './vhd'
import resolveRelativeFromFile from './_resolveRelativeFromFile'
import { DISK_TYPE_DYNAMIC } from './_constants'

export default async function checkVhain(handler, path) {
  while (true) {
    const vhd = new Vhd(handler, path)
    await vhd.readHeaderAndFooter()
    await vhd.readBlockAllocationTable()

    if (vhd.footer.diskType === DISK_TYPE_DYNAMIC) {
      break
    }

    path = resolveRelativeFromFile(path, vhd.header.parentUnicodeName)
  }
}
