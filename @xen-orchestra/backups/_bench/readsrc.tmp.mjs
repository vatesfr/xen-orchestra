// TEMPORARY: read-only throughput of a backup disk, through the restore chain (openDiskChain + ReadAhead)
import { getHandler } from '@xen-orchestra/fs'
import { openDiskChain } from '@xen-orchestra/backup-archive/disks'
import { ReadAhead } from '@xen-orchestra/disk-transform'
const [url, path] = process.argv.slice(2)
const handler = getHandler({ url })
await handler.sync()
const disk = new ReadAhead(await openDiskChain({ handler, path }))
let bytes = 0
const cpu0 = process.cpuUsage()
const t0 = performance.now()
for await (const { data } of disk.diskBlocks()) bytes += data.length
const s = (performance.now() - t0) / 1e3
const cpu = process.cpuUsage(cpu0)
console.log(JSON.stringify({ url: url.slice(7, 25), MiB: Math.round(bytes / 2 ** 20), MiBps: Math.round(bytes / 2 ** 20 / s), cpuPct: Math.round(((cpu.user + cpu.system) / 1e6 / s) * 100) }))
await handler.forget()
process.exit(0)
