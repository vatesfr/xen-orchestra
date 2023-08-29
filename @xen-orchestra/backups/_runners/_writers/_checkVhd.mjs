import { openVhd } from 'vhd-lib'
import Disposable from 'promise-toolbox/Disposable'

export async function checkVhd(handler, path) {
  await Disposable.use(openVhd(handler, path), () => {})
}
