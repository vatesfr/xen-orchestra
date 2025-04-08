import tar from 'tar-stream'

import writeOvaXml from './_writeOvaXml.mjs'
import writeDisk from './_writeDisk.mjs'

export async function importVm(vm, xapi, sr, network) {
  const pack = tar.pack()
  const taskRef = await xapi.task_create('VM import')
  const query = {
    sr_id: sr.$ref,
  }

  const promise = xapi
    .putResource(pack, '/import/', {
      query,
      task: taskRef,
    })
    .catch(err => console.error(err))

  await writeOvaXml(pack, vm, { sr, network })
  for (const stream of vm.streams) {
    await writeDisk(pack, stream, vhd.ref)
  }
  pack.finalize()
  const str = await promise
  const matches = /OpaqueRef:[0-9a-z-]+/.exec(str)
  if (!matches) {
    const error = new Error(`no opaque ref found in  ${str}`)
    throw error
  }
  return matches[0]
}
