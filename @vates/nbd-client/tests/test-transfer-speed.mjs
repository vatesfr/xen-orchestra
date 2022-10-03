import NbdClient from './client.mjs'
import { Xapi } from 'xen-api'
import readline from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'
import { asyncMap } from '@xen-orchestra/async-map'
import { downloadVhd, getFullBlocks } from './utils'

const xapi = new Xapi({
  auth: {
    user: 'root',
    password: 'vateslab',
  },
  url: '172.16.210.11',
  allowUnauthorized: true,
})
await xapi.connect()

let networks = await xapi.call('network.get_all_records')
console.log({ networks })
let nbdNetworks = Object.values(networks).filter(
  network => network.purpose.includes('nbd') || network.purpose.includes('insecure_nbd')
)

let secure = false
if (!nbdNetworks.length) {
  console.log(`you don't have any nbd enabled network`)
  console.log(`please add a purpose of nbd (to use tls) or insecure_nbd to oneof the host network`)
  process.exit()
}

const network = nbdNetworks[0]
secure = network.purpose.includes('nbd')
console.log(`we will use network **${network.name_label}** ${secure ? 'with' : 'without'} TLS`)

const rl = readline.createInterface({ input, output })
const question = text => {
  return new Promise(resolve => {
    rl.question(text, resolve)
  })
}

let vmuuid, vmRef
do {
  vmuuid = '123e4f2b-498e-d0af-15ae-f835a1e9f59f' // await question('VM uuid ? ')
  try {
    vmRef = xapi.getObject(vmuuid).$ref
  } catch (e) {
    console.log(e)
    console.log('maybe the objects was not loaded, try again ')
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

nbd.secure = secure
const nbdClient = new NbdClient(nbd)
await nbdClient.connect()

const maxDuration =
  parseInt(await question('Maximum duration per test in second ? (-1 for unlimited, default 30) '), 10) || 30
console.log('Will start downloading blocks during ', maxDuration, 'seconds')

console.log('## will check the vhd download speed')

const stats = {}

for (const nbBlocksRead of [32, 16, 8, 4, 2, 1]) {
  stats[nbBlocksRead * 64 * 1024] = {}
  for (const concurrency of [32, 16, 8, 4, 2]) {
    const { speed } = await getFullBlocks({ nbdClient, concurrency, nbBlocksRead })

    stats[blockSize][concurrency] = speed
  }
}

console.log('speed summary')
console.table(stats)

console.log('## will check full vhd export  size and speed')
await downloadVhd(xapi, {
  format: 'vhd',
  vdi: snapshotRef,
})

console.log('## will check full raw export  size and speed')
await downloadVhd(xapi, {
  format: 'raw',
  vdi: snapshotRef,
})
process.exit()
