import { openVhd } from '.'
import resolveRelativeFromFile from './_resolveRelativeFromFile'
import { DISK_TYPE_DYNAMIC } from './_constants'
import { Disposable } from 'promise-toolbox'

export default async function checkChain(handler, path) {
  await Disposable.use(function* () {
    let vhd
    do {
      vhd = yield openVhd(handler, path)
      path = resolveRelativeFromFile(path, vhd.header.parentUnicodeName)
    } while (vhd.footer.diskType !== DISK_TYPE_DYNAMIC)
  })
}
