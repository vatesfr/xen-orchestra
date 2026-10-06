// Local benchmark of the NBD → VhdDirectory (block mode) backup pipeline.
// Mimics XapiDiskSource#formatSourceDisk + IncrementalXapi._copy + IncrementalRemoteWriter
//
// env:
//   MODE=full|read|write   full: NBD → remote, read: NBD only, write: file → remote
//   NBD_PORT=10809 NBD_CONC=1 (connections) READAHEAD=10 (blocks in flight in ReadAhead)
//   TLS=1 (use STARTTLS, like XAPI NBD)  WBC=16 (writeBlockConcurrency)
//   COMP=brotli|gzip|none  ENC=1 (encrypted remote)  PCT=100 (% of blocks exported)
import { readFileSync, openSync, readSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { performance } from 'node:perf_hooks'
import {
  RandomAccessDisk,
  ReadAhead,
  SynchronizedDisk,
  ThrottledDisk,
  TimeoutDisk,
} from '@xen-orchestra/disk-transform'
import { Throttle } from '@vates/generator-toolbox'
import MultiNbdClient from '@vates/nbd-client/multi.mjs'
import { getHandler } from '@xen-orchestra/fs'
import { writeToVhdDirectory } from 'vhd-lib/disk-consumer/index.mjs'

const env = process.env
const MODE = env.MODE ?? 'full'
const BLOCK = 2 * 1024 * 1024
const RAW = env.RAW ?? '/data/bench/mixed.raw'
const SIZE = Number(env.SIZE_GB ?? 2) * 1024 * 1024 * 1024
const PCT = Number(env.PCT ?? 100)
const indexes = []
// BLOCKS_FILE: the indexes to read, one per line (the allocated blocks of a real chain), MAX_BLOCKS of them
const fromFile = env.BLOCKS_FILE
  ? (await import('node:fs')).readFileSync(env.BLOCKS_FILE, 'utf8').split('\n').filter(Boolean).map(Number).slice(0, Number(env.MAX_BLOCKS ?? Infinity))
  : undefined
const CYCLE = env.CYCLE_MB ? Number(env.CYCLE_MB) / 2 : Infinity // read the same range again and again (server cache)
for (let i = 0; fromFile === undefined && i < SIZE / BLOCK; i++) {
  if (CYCLE !== Infinity) {
    indexes.push(i % CYCLE)
    continue
  }
  // deterministic sparse selection
  if ((i * 37) % 100 < PCT) indexes.push(i)
}
if (fromFile !== undefined) indexes.push(...fromFile)

class BenchDisk extends RandomAccessDisk {
  #read
  #close
  constructor(read, close = async () => {}) {
    super()
    this.#read = read
    this.#close = close
  }
  async init() {}
  async close() {
    await this.#close()
  }
  getVirtualSize() {
    return SIZE
  }
  getBlockSize() {
    return BLOCK
  }
  getBlockIndexes() {
    return indexes
  }
  hasBlock(i) {
    return indexes.includes(i)
  }
  isDifferencing() {
    return false
  }
  async readBlock(index) {
    return { index, data: await this.#read(index) }
  }
}

// real XAPI: env HOST, XAPI_PASSWORD, VDI, NBD_ADDRESS (optional filter)
async function getXapiNbdInfos(vdiUuid) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  let id = 0
  const call = async (method, ...params) => {
    const res = await fetch(`https://${env.HOST}/jsonrpc`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method, params, id: ++id }),
    })
    const json = await res.json()
    if (json.error) throw new Error(JSON.stringify(json.error))
    return json.result
  }
  const session = await call('session.login_with_password', 'root', env.XAPI_PASSWORD, '1.0', 'bench')
  const ref = await call('VDI.get_by_uuid', session, vdiUuid)
  let infos = await call('VDI.get_nbd_info', session, ref)
  if (env.NBD_ADDRESS) infos = infos.filter(_ => _.address === env.NBD_ADDRESS)
  return infos
}

async function openSource() {
  if (MODE === 'write' && env.SRC === 'mem') {
    // no disk nor network read: 64 real blocks preloaded in memory, cycled
    const fd = openSync(RAW, 'r')
    const pool = []
    for (let i = 0; i < 64; i++) {
      const b = Buffer.allocUnsafe(BLOCK)
      readSync(fd, b, 0, BLOCK, ((i * 13) % 1024) * BLOCK)
      pool.push(b)
    }
    return new BenchDisk(async index => pool[index % 64])
  }
  if (MODE === 'write') {
    const fd = openSync(RAW, 'r')
    return new BenchDisk(async index => {
      const b = Buffer.allocUnsafe(BLOCK)
      readSync(fd, b, 0, BLOCK, index * BLOCK)
      return b
    })
  }
  let infos
  if (env.VDI !== undefined) {
    infos = await getXapiNbdInfos(env.VDI)
  } else {
    const info = { address: env.NBD_HOST ?? '127.0.0.1', port: Number(env.NBD_PORT ?? 10809), exportname: env.EXPORTNAME ?? '' }
    if (env.TLS === '1') info.cert = readFileSync('/data/bench/certs/server-cert.pem', 'utf8')
    infos = [info]
  }
  const client = new MultiNbdClient(infos, { nbdConcurrency: Number(env.NBD_CONC ?? 1) })
  await client.connect()
  if (env.POOL === '1') {
    // same path as XapiStreamNbdSource/XapiVhdCbtSource: pooled buffers
    const { readNbdBlock } = await import('@xen-orchestra/xapi/disks/utils.mjs')
    const disk = new BenchDisk(
      () => {},
      () => client.disconnect()
    )
    disk.readBlock = index => readNbdBlock(client, index, BLOCK)
    return disk
  }
  return new BenchDisk(
    index => client.readBlock(index, BLOCK),
    () => client.disconnect()
  )
}

const t0 = performance.now()
const cpu0 = process.cpuUsage()
let source = await openSource()
// same stack as XapiDiskSource#formatSourceDisk
source = new TimeoutDisk(new ReadAhead(source, { maxNumber: Number(env.READAHEAD ?? 10) }), 20 * 60e3)
let bytes = 0
if (MODE === 'read') {
  for await (const { data } of source.diskBlocks()) bytes += data.length
} else {
  // same stack as IncrementalXapi._copy
  const throttled = new ThrottledDisk(source, new Throttle(0))
  const sync = new SynchronizedDisk(throttled)
  const disk = sync.fork('IncrementalRemoteWriter')
  await rm(env.ENC === '1' ? '/data/bench/remote-enc/vm' : '/data/bench/remote/vm', { recursive: true, force: true })
  const handler = getHandler({
    url: env.ENC === '1' ? 'file:///data/bench/remote-enc' : 'file:///data/bench/remote',
    encryptionKey: env.ENC === '1' ? '73c1838d7d8a6088ca2317fb5f29cd91' : undefined,
  })
  await handler.sync()
  if (env.REMOTE === 'null') {
    // keep compression + encryption (done before _outputFile), drop the block data I/O
    const outputFile = handler._outputFile.bind(handler)
    handler._outputFile = async (file, data, opts) => {
      if (file.includes('/blocks/')) return
      return outputFile(file, data, opts)
    }
  }
  bytes = indexes.length * BLOCK
  await writeToVhdDirectory({
    disk,
    target: {
      handler,
      path: 'vm/disk.alias.vhd',
      concurrency: Number(env.WBC ?? 16),
      compression: env.COMP === 'none' ? undefined : (env.COMP ?? 'brotli'),
      validator: async () => {},
    },
  })
  await handler.forget()
}
const s = (performance.now() - t0) / 1e3
const cpu = process.cpuUsage(cpu0)
console.log(
  JSON.stringify({
    MODE,
    POOL: env.POOL ?? 0,
    NBD_CONC: env.NBD_CONC ?? 1,
    READAHEAD: env.READAHEAD ?? 10,
    TLS: env.TLS ?? 0,
    WBC: env.WBC ?? 16,
    COMP: env.COMP ?? 'brotli',
    ENC: env.ENC ?? 0,
    UV: env.UV_THREADPOOL_SIZE ?? 4,
    REMOTE: env.REMOTE ?? 'file',
    SRC: env.SRC ?? (MODE === 'write' ? 'file' : 'nbd'),
    MBps: Math.round(bytes / 1048576 / s),
    sec: +s.toFixed(1),
    cpuPct: Math.round(((cpu.user + cpu.system) / 1e6 / s) * 100),
  })
)
process.exit(0)
