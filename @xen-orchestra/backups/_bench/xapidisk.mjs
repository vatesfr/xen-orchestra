// Reads a whole VDI through XapiDiskSource (NBD), like a full backup, and reports which path was used
// env: VDI, NBD_CONC (default 1), XAPI_PASSWORD
import { Xapi } from '@xen-orchestra/xapi'
import { XapiDiskSource } from '@xen-orchestra/xapi/disks/Xapi.mjs'

const env = process.env
const xapi = new Xapi({
  url: 'https://192.168.1.5',
  allowUnauthorized: true,
  auth: { user: 'root', password: env.XAPI_PASSWORD },
  preferNbd: true,
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
const source = new XapiDiskSource({ xapi, vdiRef, preferNbd: true, nbdConcurrency: Number(env.NBD_CONC ?? 1) })
const t0 = performance.now()
await source.init()
const initMs = Math.round(performance.now() - t0)
const exportsDuringTransfer = await pluginExports()
let bytes = 0
let blocks = 0
const t1 = performance.now()
for await (const block of source.diskBlocks()) {
  bytes += block.data.length
  blocks++
  block.release?.()
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
