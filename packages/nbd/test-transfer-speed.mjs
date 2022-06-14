import NbdClient from './client.mjs'
import { Xapi } from 'xen-api'
import readline from 'node:readline'
import { stdin as input, stdout as output } from 'node:process'
import { asyncMap } from '@xen-orchestra/async-map'
import { asyncEach } from '@vates/async-each'
import { CancelToken } from 'promise-toolbox'
import zlib from 'node:zlib'

const xapi = new Xapi({
  auth: {
    user: 'root',
    password: 'vateslab',
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

console.log('will search for suitable snapshots')
const snapshots = vdi.snapshots.map(snapshotRef => xapi.getObject(snapshotRef))

console.log('found snapshots will use the last one for tests')
const snapshotRef = xapi.getObject(snapshots[snapshots.length - 1].uuid).$ref

console.log('got changes')
console.log('will connect to NBD server')

const [nbd, ..._] = await xapi.call('VDI.get_nbd_info', snapshotRef)

if (!nbd) {
  console.error('Nbd is not enabled on the host')
  console.error('you should add `insecure_nbd` as the `purpose` of a network of this host')
  process.exit()
}

const client = new NbdClient(nbd)
await client.connect()

const maxSize = parseInt(await question('Maximum data size per test in MB ? (-1 for unlimited) '), 10) * 1024 * 1024
console.log('Will download ', maxSize, 'bytes')

console.log('## will check the vhd download speed')

const stats = {}
async function getFullBlocks(concurrency, nbBlocksRead) {
  const blockSize = nbBlocksRead * 64 * 1024
  let nbModified = 0,
    size = 0
  console.log('### with concurrency ', concurrency)
  const start = new Date()
  console.log(' max nb blocks ', client.nbBlocks / nbBlocksRead)
  function* blockIterator() {
    for (let i = 0; i < client.nbBlocks / nbBlocksRead; i++) {
      if (maxSize > 0 && i * blockSize < maxSize) {
        yield i
      }
    }
  }
  const interval = setInterval(() => {
    console.log(`${nbModified} block handled in ${new Date() - start} ms`)
  }, 5000)
  await asyncEach(
    blockIterator(),
    async blockIndex => {
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
  console.log('nb blocks : ', nbModified)
  console.log('read : ', size, 'octets')
  const speed = Math.round(((size / 1024 / 1024) * 1000 * 100) / (new Date() - start)) / 100
  console.log('speed : ', speed, 'MB/s')
  stats[blockSize][concurrency] = speed
}

for (const nbBlocksRead of [32, 16, 8, 4, 2, 1]) {
  stats[nbBlocksRead * 64 * 1024] = {}
  for (const concurrency of [32, 16, 8, 4, 2]) {
    await getFullBlocks(concurrency, nbBlocksRead)
  }
}

console.log('speed summary')
console.table(stats)

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
    if (maxSize > 0 && sizeStream >= maxSize) {
      break
    }
  }
  clearInterval(interval)
  console.log('Stream duration :', new Date() - startStream)
  console.log('Stream read : ', sizeStream, 'octets')
  const speed = Math.round(((sizeStream / 1024 / 1024) * 1000 * 100) / (new Date() - startStream)) / 100
  console.log('speed : ', speed, 'MB/s')
}

console.log('## will check full vhd export  size and speed')
await downloadVhd({
  format: 'vhd',
  vdi: snapshotRef,
})

process.exit()
