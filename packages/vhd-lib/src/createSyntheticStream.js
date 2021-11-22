import { openVhd, VhdSynthetic } from '.'
import { Disposable } from 'promise-toolbox'

export default async function createSyntheticStream(handler, paths) {
  paths = Array.isArray(paths) ? paths : [paths]

  // I don't want the vhds to be disposed on return
  // but only when the stream is done ( or failed )
  const disposables = await Disposable.all(paths.map(path => openVhd(handler, path)))
  const vhds = disposables.value
  const synthetic = new VhdSynthetic(vhds)
  await synthetic.readHeaderAndFooter()
  await synthetic.readBlockAllocationTable()
  const stream = await synthetic.stream()
  stream.on('end', () => disposables.dispose())
  stream.on('close', () => disposables.dispose())
  stream.on('error', () => disposables.dispose())
  return stream
}
