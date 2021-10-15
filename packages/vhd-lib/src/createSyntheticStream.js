import { openVhd } from '.'
import { VhdSynthetic } from './Vhd/VhdSynthetic'
import { Disposable } from 'promise-toolbox'

export default async function createSyntheticStream(handler, paths) {
  return await Disposable.use(async function* () {
    const vhds = []
    if (typeof paths === 'string') {
      paths = [paths]
    }

    for (const path of paths) {
      vhds.push(yield openVhd(handler, path))
    }
    const vhd = yield VhdSynthetic.open(vhds)
    await vhd.readBlockAllocationTable()
    // @todo : can I do a return from a disposable ?
    return vhd.vhdStream()
  })
}
