import NbdClient from './client.mjs'
import { Xapi } from 'xen-api'
import { asyncMap } from '@xen-orchestra/async-map'
import { downloadVhd, getFullBlocks } from './utils.mjs'
import fs from 'fs/promises'

const xapi = new Xapi({
  auth: {
    user: 'root',
    password: 'vateslab',
  },
  url: '172.16.210.11',
  allowUnauthorized: true,
})
await xapi.connect()

let vmuuid = '123e4f2b-498e-d0af-15ae-f835a1e9f59f',
  vmRef
do {
  try {
    vmRef = xapi.getObject(vmuuid).$ref
  } catch (e) {
    console.log('maybe the objects was not loaded, try again ')
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
} while (!vmRef)

const vdiRefs = (
  await asyncMap(await xapi.call('VM.get_VBDs', vmRef), async vbd => {
    const vdi = await xapi.call('VBD.get_VDI', vbd)
    return vdi
  })
).filter(vdiRef => vdiRef !== 'OpaqueRef:NULL')

const vdiRef = vdiRefs[0]

const vdi = xapi.getObject(vdiRef)

console.log('Will work on vdi  [', vdi.name_label, ']')

console.log('will search for suitable snapshots')
const snapshots = vdi.snapshots.map(snapshotRef => xapi.getObject(snapshotRef))

console.log('found snapshots will use the last one for tests')
const snapshotRef = xapi.getObject(snapshots[snapshots.length - 1].uuid).$ref

console.log('will connect to NBD server')

const [nbd, ..._] = await xapi.call('VDI.get_nbd_info', snapshotRef)

if (!nbd) {
  console.error('Nbd is not enabled on the host')
  console.error('you should add `insecure_nbd` as the `purpose` of a network of this host')
  process.exit()
}

if (!nbd) {
  console.error('Nbd is not enabled on the host')
  console.error('you should add `insecure_nbd` as the `purpose` of a network of this host')
  process.exit()
}

const nbdClient = new NbdClient(nbd)
await nbdClient.connect()
let fd = await fs.open('/tmp/nbd.raw', 'w')
await getFullBlocks({
  nbdClient,
  concurrency: 8,
  nbBlocksRead: 16 /* 1MB block */,
  fd,
})
console.log(' done nbd ')
await fd.close()

fd = await fs.open('/tmp/export.raw', 'w')
await downloadVhd({
  xapi,
  query: {
    format: 'raw',
    vdi: snapshotRef,
  },
  fd,
})

fd.close()

fd = await fs.open('/tmp/export.vhd', 'w')
await downloadVhd({
  xapi,
  query: {
    format: 'vhd',
    vdi: snapshotRef,
  },
  fd,
})

fd.close()
