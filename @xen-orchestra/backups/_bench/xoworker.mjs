// xoworker.mjs : prototype, the NBD/TLS source runs in a worker_thread, the main thread only writes the VhdDirectory
// The worker reads with XapiDiskSource (plugin or xapi-nbd), copies each block into a
// recycled ArrayBuffer and transfers it (no copy) to the main thread; the main thread gives it back once the
// block file is written. CREDITS bounds the blocks in flight (memory: CREDITS x 2 MiB).
// env: VDI, XAPI_URL, XAPI_PASSWORD, NBD_CONC, REMOTE (path or null), WBC, CREDITS (default 16), MAX_S
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'

const BLOCK = 2 * 1024 * 1024

if (!isMainThread) {
  // ---------------------------------------------------------------- worker: the source
  const env = workerData
  const { Xapi } = await import('@xen-orchestra/xapi')
  const { XapiDiskSource } = await import('@xen-orchestra/xapi/disks/Xapi.mjs')
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  const xapi = new Xapi({ url: env.XAPI_URL, allowUnauthorized: true, auth: { user: 'root', password: env.XAPI_PASSWORD }, preferNbd: true })
  await xapi.connect()
  await xapi.objectsFetched
  const vdiRef = await xapi.call('VDI.get_by_uuid', env.VDI)
  const source = new XapiDiskSource({ xapi, vdiRef, preferNbd: true, nbdConcurrency: Number(env.NBD_CONC ?? 1) })
  await source.init()
  const free = []
  let credits = Number(env.CREDITS ?? 16)
  let wake
  parentPort.on('message', ab => {
    free.push(ab)
    credits++
    wake?.()
  })
  parentPort.postMessage({ type: 'meta', size: source.getVirtualSize(), blockSize: source.getBlockSize(), indexes: source.getBlockIndexes() })
  const t0 = performance.now()
  const maxMs = Number(env.MAX_S ?? Infinity) * 1e3
  for await (const block of source.diskBlocks()) {
    while (credits === 0) await new Promise(resolve => (wake = resolve))
    credits--
    const ab = free.pop() ?? new ArrayBuffer(BLOCK)
    block.data.copy(Buffer.from(ab))
    block.release?.()
    parentPort.postMessage({ type: 'block', index: block.index, length: block.data.length, ab }, [ab])
    if (performance.now() - t0 > maxMs) break
  }
  parentPort.postMessage({ type: 'end', elu: +performance.eventLoopUtilization().utilization.toFixed(2) })
  await xapi.disconnect()
} else {
  // ---------------------------------------------------------------- main: the writer
  const env = process.env
  const { RandomAccessDisk, ThrottledDisk, SynchronizedDisk } = await import('@xen-orchestra/disk-transform')
  const { Throttle } = await import('@vates/generator-toolbox')
  const { getHandler } = await import('@xen-orchestra/fs')
  const { writeToVhdDirectory } = await import('vhd-lib/disk-consumer/index.mjs')

  const worker = new Worker(new URL(import.meta.url), { workerData: { ...env } })
  const queue = []
  let waiting
  let meta
  const metaReady = new Promise(resolve => {
    worker.on('message', message => {
      if (message.type === 'meta') return resolve((meta = message))
      queue.push(message)
      waiting?.()
    })
  })
  worker.on('error', error => {
    console.error(error)
    process.exit(1)
  })
  await metaReady

  let bytes = 0
  let workerElu
  const source = new (class extends RandomAccessDisk {
    async init() {}
    async close() {}
    getVirtualSize() { return meta.size }
    getBlockSize() { return meta.blockSize }
    getBlockIndexes() { return meta.indexes }
    hasBlock(i) { return meta.indexes.includes(i) }
    isDifferencing() { return false }
    async readBlock() { throw new Error('sequential only') }
    async *buildDiskBlockGenerator() {
      while (true) {
        while (queue.length === 0) await new Promise(resolve => (waiting = resolve))
        const message = queue.shift()
        if (message.type === 'end') {
          workerElu = message.elu
          return
        }
        bytes += message.length
        let released = false
        yield {
          index: message.index,
          data: Buffer.from(message.ab, 0, message.length),
          release: () => {
            if (!released) {
              released = true
              worker.postMessage(message.ab, [message.ab])
            }
          },
        }
      }
    }
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
  const disk = new SynchronizedDisk(new ThrottledDisk(source, new Throttle(0))).fork('IncrementalRemoteWriter')
  const rss0 = process.memoryUsage().rss
  let rssPeak = rss0
  const rssTimer = setInterval(() => (rssPeak = Math.max(rssPeak, process.memoryUsage().rss)), 200)
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
  console.log(JSON.stringify({
    SRC: 'vdi-worker', REMOTE: remote, CREDITS: Number(env.CREDITS ?? 16), MB: Math.round(bytes / 1048576), sec: +s.toFixed(1),
    MBps: Math.round(bytes / 1048576 / s), processCpuPct: Math.round(((cpu.user + cpu.system) / 1e6 / s) * 100),
    mainElu: +elu.utilization.toFixed(2), workerElu, rssMB: Math.round(rss0 / 1048576), rssPeakMB: Math.round(rssPeak / 1048576),
  }))
  process.exit(0)
}
