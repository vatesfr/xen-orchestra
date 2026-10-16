import { toXvaStream } from './writeXva.mjs'

export async function importVm(vm, xapi, sr, network) {
  const taskRef = await xapi.task_create('VM import')
  const query = {
    sr_id: sr.$ref,
  }

  const str = await xapi.putResource(toXvaStream(vm, { sr, network }), '/import/', {
    query,
    task: taskRef,
  })
  const matches = /OpaqueRef:[0-9a-z-]+/.exec(str)
  if (!matches) {
    const error = new Error(`no opaque ref found in  ${str}`)
    throw error
  }
  return matches[0]
}
