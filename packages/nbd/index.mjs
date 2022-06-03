import NbdClient from './client.mjs'
import { Xapi } from 'xen-api'
import readline from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'
import { asyncMap } from '@xen-orchestra/async-map'
import { asyncEach } from '@vates/async-each'
import { CancelToken } from 'promise-toolbox'

const xapi = new Xapi({
  auth: {
    user: 'root',
    password: '',
  },
  url: '172.16.210.11',
  allowUnauthorized: true,
})
await xapi.connect()

const rl = readline.createInterface({ input, output })
const question = text => {
  return new Promise(resolve => {
    rl.question(text, resolve)
  })
}

let vmuuid, vmRef
do {
  vmuuid = await question('VM uuid ? ')
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
const cbt_enabled = vdi.cbt_enabled
console.log('Change block tracking is [', cbt_enabled ? 'enabled' : 'disabled', ']')

if (!cbt_enabled) {
  const shouldEnable = await question('would you like to enable it ? Y/n ')
  if (shouldEnable === 'Y') {
    await xapi.call('VDI.enable_cbt', vdiRef)
    console.log('CBT is now enable for this VDI')
    console.log('You must make a snapshot, write some data and relaunch this script to backup changes')
  } else {
    console.warn('did nothing')
  }
  process.exit()
}

console.log('will search for suitable snapshots')
const snapshots = vdi.snapshots.map(snapshotRef => xapi.getObject(snapshotRef)).filter(({ cbt_enabled }) => cbt_enabled)

if (snapshots.length < 2) {
  throw new Error(`not enough snapshots with cbt enabled , found ${snapshots.length} and 2 are needed`)
}

console.log('found snapshots will compare last two snapshots with cbt_enabled')
const snapshotRef = xapi.getObject(snapshots[snapshots.length - 1].uuid).$ref
const snapshotTarget = xapi.getObject(snapshots[snapshots.length - 2].uuid).$ref
console.log('older snapshot is ', xapi.getObject(snapshotRef).snapshot_time)
console.log('newer one is ', xapi.getObject(snapshotTarget).snapshot_time)

console.log('## will get bitmap of changed blocks')
const cbt = Buffer.from(await xapi.call('VDI.list_changed_blocks', snapshotRef, snapshotTarget), 'base64')

console.log('got changes')
console.log('will connect to NBD server')

const [nbd, ..._] = await xapi.call('VDI.get_nbd_info', snapshotTarget)

if (!nbd) {
  console.error('Nbd is not enabled on the host')
  console.error('you should add `insecure_nbd` as the `purpose` of a network of this host')
  process.exit()
}

const client = new NbdClient(nbd)
await client.connect()

// @todo : should also handle last blocks that could be incomplete

const stats = {}
async function getChangedNbdBlocks(changed, concurrency, blockSize) {
  let nbModified = 0,
    size = 0
  const start = new Date()
  console.log('### with concurrency ', concurrency, ' blockSize ', blockSize / 1024 / 1024, 'MB')
  const interval = setInterval(() => {
    console.log(`${nbModified} block handled in ${new Date() - start} ms`)
  }, 5000)
  await asyncEach(
    changed,
    async blockIndex => {
      if (new Date() - start > 30000) {
        return
      }
      const data = await client.readBlock(blockIndex, blockSize)
      size += data?.length ?? 0
      nbModified++
    },
    {
      concurrency,
    }
  )
  clearInterval(interval)
  console.log('duration :', new Date() - start)
  console.log('read : ', size, 'octets')
  console.log('speed : ', Math.round(((size / 1024 / 1024) * 1000) / (new Date() - start)), 'MB/s')
  stats[blockSize][concurrency] = Math.round(((size / 1024 / 1024) * 1000) / (new Date() - start))
}

for (const nbBlocksRead of [32, 16, 8, 4, 2, 1]) {
  const blockSize = nbBlocksRead * 64 * 1024
  stats[blockSize] = {}
  const MASK = 0x80
  const test = (map, bit) => ((map[bit >> 3] << (bit & 7)) & MASK) !== 0

  const changed = []
  for (let i = 0; i < (cbt.length * 8) / nbBlocksRead; i++) {
    let blockChanged = false
    for (let j = 0; j < nbBlocksRead; j++) {
      blockChanged = blockChanged || test(cbt, i * nbBlocksRead + j)
    }
    if (blockChanged) {
      changed.push(i)
    }
  }
  console.log(changed.length, 'block changed')
  for (const concurrency of [32, 16, 8, 4, 2]) {
    await getChangedNbdBlocks(changed, concurrency, blockSize)
    console.table(stats)
  }
}
console.log('speed summary')
console.table(stats)

console.log('## will check full download of the base vdi ')

async function getFullBlocks(concurrency) {
  let nbModified = 0,
    size = 0
  console.log('### with concurrency ', concurrency)
  const start = new Date()
  function* blockIterator() {
    for (let i = 0; i < (cbt.length * 8) / nbBlocksRead; i++) {
      yield i
    }
  }
  const interval = setInterval(() => {
    console.log(`${nbModified} block handled in ${new Date() - start} ms`)
  }, 5000)
  await asyncEach(
    blockIterator(),
    async blockIndex => {
      const data = await client.readBlock(blockIndex)
      size += data?.length ?? 0
      nbModified++
    },
    {
      concurrency,
    }
  )
  clearInterval(interval)
  console.log('duration :', new Date() - start)
  console.log('nb blocks : ', nbModified)
  console.log('read : ', size, 'octets')
  console.log('speed : ', Math.round(((size / 1024 / 1024) * 1000) / (new Date() - start)), 'MB/s')
}
await getFullBlocks(16, 512 * 1024) // a good sweet spot

console.log('## will check vhd delta export  size and speed')

async function downloadVhd(query) {
  const startStream = new Date()
  let sizeStream = 0
  let nbChunk = 0

  const interval = setInterval(() => {
    console.log(`${nbChunk} chunks , ${sizeStream} octets handled in ${new Date() - startStream} ms`)
  }, 5000)
  const stream = await xapi.getResource(CancelToken.none, '/export_raw_vdi/', {
    query,
  })
  for await (const chunk of stream) {
    sizeStream += chunk.length
    nbChunk++
  }
  clearInterval(interval)
  console.log('Stream duration :', new Date() - startStream)
  console.log('Stream read : ', sizeStream, 'octets')
  console.log('speed : ', Math.round(((sizeStream / 1024 / 1024) * 1000) / (new Date() - startStream)), 'MB/s')
}

await downloadVhd({
  format: 'vhd',
  base: snapshotRef,
  vdi: snapshotTarget,
})
console.log('## will check full vhd export  size and speed')
await downloadVhd({
  format: 'vhd',
  vdi: snapshotTarget,
})
