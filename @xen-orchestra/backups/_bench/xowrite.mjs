// xowrite.mjs : XO writing a VhdDirectory on a local remote, with the real stack of IncrementalXapi
// (ThrottledDisk -> SynchronizedDisk fork -> writeToVhdDirectory), no compression, no encryption.
// env:
//   SRC=mem          64 real 2 MiB blocks cycled from memory: no read cost, the writer alone (SIZE_GB of data)
//   SRC=vdi VDI=uuid XapiDiskSource on XAPI_URL (plugin or xapi-nbd like the reads), NBD_CONC
//   REMOTE=/path (default /data/bench/remote) or null (block files not written)
//   WBC=16 (writeBlockConcurrency), MAX_S (stop the source after N seconds)
import { openSync, readSync, readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { RandomAccessDisk, ThrottledDisk, SynchronizedDisk } from '@xen-orchestra/disk-transform'
import { Throttle } from '@vates/generator-toolbox'
import { getHandler } from '@xen-orchestra/fs'
import { writeToVhdDirectory } from 'vhd-lib/disk-consumer/index.mjs'

const env = process.env
const BLOCK = 2 * 1024 * 1024
let source
let xapi
if (env.SRC === 'vdi') {
  const { Xapi } = await import('@xen-orchestra/xapi')
  const { XapiDiskSource } = await import('@xen-orchestra/xapi/disks/Xapi.mjs')
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  xapi = new Xapi({ url: env.XAPI_URL, allowUnauthorized: true, auth: { user: 'root', password: env.XAPI_PASSWORD }, preferNbd: true })
  await xapi.connect()
  await xapi.objectsFetched
  const vdiRef = await xapi.call('VDI.get_by_uuid', env.VDI)
  source = new XapiDiskSource({ xapi, vdiRef, preferNbd: true, nbdConcurrency: Number(env.NBD_CONC ?? 1) })
  await source.init()
} else {
  const size = Number(env.SIZE_GB ?? 16) * 1024 ** 3
  const fd = openSync('/data/bench/mixed.raw', 'r')
  const pool = []
  for (let i = 0; i < 64; i++) {
    const b = Buffer.allocUnsafe(BLOCK)
    readSync(fd, b, 0, BLOCK, ((i * 13) % 1024) * BLOCK)
    pool.push(b)
  }
  const indexes = Array.from({ length: size / BLOCK }, (_, i) => i)
  source = new (class extends RandomAccessDisk {
    async init() {}
    async close() {}
    getVirtualSize() { return size }
    getBlockSize() { return BLOCK }
    getBlockIndexes() { return indexes }
    hasBlock() { return true }
    isDifferencing() { return false }
    async readBlock(index) { return { index, data: pool[index % 64] } }
  })()
}

// MAX_S: stop the source after N seconds (the VHD is still finalized)
const maxMs = Number(env.MAX_S ?? Infinity) * 1e3
let bytes = 0
const counted = new (class extends RandomAccessDisk {
  async init() {}
  async close() { return source.close() }
  getVirtualSize() { return source.getVirtualSize() }
  getBlockSize() { return source.getBlockSize() }
  getBlockIndexes() { return source.getBlockIndexes() }
  hasBlock(i) { return source.hasBlock(i) }
  isDifferencing() { return false }
  async *buildDiskBlockGenerator() {
    for await (const block of await source.buildDiskBlockGenerator()) {
      bytes += block.data.length
      yield block
      if (performance.now() - t0 > maxMs) break
    }
  }
  async readBlock(i) { return source.readBlock(i) }
})()

const remote = env.REMOTE ?? '/data/bench/remote'
const url = remote === 'null' ? 'file:///data/bench/remote' : `file://${remote}`
await rm(`${url.slice(7)}/vm`, { recursive: true, force: true })
const handler = getHandler({ url })
await handler.sync()
if (remote === 'null') {
  const outputFile = handler._outputFile.bind(handler)
  handler._outputFile = async (file, data, opts) => (file.includes('/blocks/') ? undefined : outputFile(file, data, opts))
}
const disk = new SynchronizedDisk(new ThrottledDisk(counted, new Throttle(0))).fork('IncrementalRemoteWriter')

// what the VM's block device really wrote, from /proc/diskstats (sectors written)
const dev = env.DEV ?? 'xvdc'
const written = () => Number(readFileSync('/proc/diskstats', 'utf8').split('\n').find(l => l.trim().split(/\s+/)[2] === dev).trim().split(/\s+/)[9]) * 512
const rss0 = process.memoryUsage().rss
let rssPeak = rss0
const rssTimer = setInterval(() => (rssPeak = Math.max(rssPeak, process.memoryUsage().rss)), 200)
const w0 = written()
const cpu0 = process.cpuUsage()
const elu0 = performance.eventLoopUtilization()
const t0 = performance.now()
await writeToVhdDirectory({
  disk,
  target: { handler, path: 'vm/disk.alias.vhd', concurrency: Number(env.WBC ?? 16), compression: undefined, validator: async () => {} },
})
const s = (performance.now() - t0) / 1e3
clearInterval(rssTimer)
const cpu = process.cpuUsage(cpu0)
const elu = performance.eventLoopUtilization(elu0)
await handler.forget()
await xapi?.disconnect()
console.log(JSON.stringify({
  SRC: env.SRC ?? 'mem', REMOTE: remote, WBC: Number(env.WBC ?? 16), UV: Number(env.UV_THREADPOOL_SIZE ?? 4),
  MB: Math.round(bytes / 1048576), sec: +s.toFixed(1), MBps: Math.round(bytes / 1048576 / s),
  diskMBps: Math.round((written() - w0) / 1048576 / s), cpuPct: Math.round(((cpu.user + cpu.system) / 1e6 / s) * 100),
  elu: +elu.utilization.toFixed(2),
  rssMB: Math.round(rss0 / 1048576), rssPeakMB: Math.round(rssPeak / 1048576),
}))
process.exit(0)
