// Reads a whole VDI through XapiDiskSource (NBD), like a full backup, and reports which path was used
// env: VDI, BASE, PREFER_NBD, NBD_CONC (default 1), XAPI_PASSWORD, XAPI_URL, MAX_S (stop after N seconds)
import { Xapi } from '@xen-orchestra/xapi'
import { XapiDiskSource } from '@xen-orchestra/xapi/disks/Xapi.mjs'

const env = process.env
const xapi = new Xapi({
  url: env.XAPI_URL ?? 'https://192.168.1.5',
  allowUnauthorized: true,
  auth: { user: 'root', password: env.XAPI_PASSWORD },
  preferNbd: env.PREFER_NBD !== '0',
})
await xapi.connect()
await xapi.objectsFetched

async function pluginExports() {
  try {
    return JSON.parse(await xapi.call('host.call_plugin', xapi.pool.master, 'xo-nbd', 'status', {})).length
  } catch (error) {
    return error.code ?? error.message
  }
}

const vdiRef = await xapi.call('VDI.get_by_uuid', env.VDI)
// BASE: uuid of the base VDI for a delta read; PREFER_NBD=0: data through the XAPI HTTP export
const baseRef = env.BASE ? await xapi.call('VDI.get_by_uuid', env.BASE) : undefined
const preferNbd = env.PREFER_NBD !== '0'
const source = new XapiDiskSource({ xapi, vdiRef, baseRef, preferNbd, nbdConcurrency: Number(env.NBD_CONC ?? 1) })
const t0 = performance.now()
await source.init()
const initMs = Math.round(performance.now() - t0)
const exportsDuringTransfer = await pluginExports()
let bytes = 0
let blocks = 0
const t1 = performance.now()
const maxMs = Number(env.MAX_S ?? Infinity) * 1e3 // optional time limit: stop after MAX_S seconds
for await (const block of source.diskBlocks()) {
  bytes += block.data.length
  blocks++
  block.release?.()
  if (performance.now() - t1 > maxMs) break
}
const s = (performance.now() - t1) / 1e3
const exportsAfter = await pluginExports()
console.log(
  JSON.stringify({
    useNbd: source.useNbd(),
    pluginExportsDuringTransfer: exportsDuringTransfer,
    pluginExportsAfterClose: exportsAfter,
    initMs,
    blocks,
    MB: Math.round(bytes / 1048576),
    MBps: Math.round(bytes / 1048576 / s),
  })
)
await xapi.disconnect()
process.exit(0)
