// TEMPORARY: backup of the "QA scale" VM with N disks in parallel, CPU per thread of the backup worker
// usage: node _scale.tmp.mjs <diskPerVmConcurrency> [label]
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { xoConnection } from './client/xoLibClient.js'
const VM = '8f50a1fa-f7a9-b9ab-1d71-f26d6017b35b'
const [concurrency = '1', label = `disks=${concurrency}`] = process.argv.slice(2)
const xo = await xoConnection({ xoUrl: 'http://localhost', username: 'admin@admin.net', password: 'admin' })
const remote = (await xo.call('remote.getAll')).find(r => r.name === (process.env.REMOTE_NAME ?? 'Test backup QA'))
const jobId = await xo.call('backupNg.createJob', {
  name: `QA scale ${label}`,
  mode: 'delta',
  vms: { id: VM },
  remotes: { id: remote.id },
  schedules: { tmp: { cron: '0 0 1 1 *', enabled: false, name: '' } },
  settings: {
    '': { preferNbd: true, nbdConcurrency: 1, diskPerVmConcurrency: Number(concurrency), timezone: 'Europe/Paris' },
    tmp: { exportRetention: 1, fullInterval: 1 },
  },
})
const schedule = (await xo.call('schedule.getAll')).find(s => s.jobId === jobId)

// CPU time (user + system ticks) per thread name of the backup worker, last value seen
const cpu = new Map()
let workerPid
const sample = () => {
  try {
    // the newest node process running the backup worker
    workerPid ??= fs
      .readdirSync('/proc')
      .filter(pid => /^\d+$/.test(pid))
      .filter(pid => {
        try {
          const argv = fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0')
          return argv[0].endsWith('node') && argv.some(a => a.endsWith('_backupWorker.mjs'))
        } catch {
          return false
        }
      })
      .sort((a, b) => b - a)[0]
    if (workerPid === undefined) return
    for (const tid of fs.readdirSync(`/proc/${workerPid}/task`)) {
      const comm = fs.readFileSync(`/proc/${workerPid}/task/${tid}/comm`, 'utf8').trim()
      const f = fs.readFileSync(`/proc/${workerPid}/task/${tid}/stat`, 'utf8').split(') ')[1].split(' ')
      cpu.set(tid, { comm, ticks: Number(f[11]) + Number(f[12]) })
    }
  } catch {}
}
const timer = setInterval(sample, 500)
const t0 = performance.now()
try {
  await xo.call('backupNg.runJob', { id: jobId, schedule: schedule.id })
} finally {
  clearInterval(timer)
}
const wall = (performance.now() - t0) / 1e3
// transfer size and duration from the job log
const log = Object.values(await xo.call('backupNg.getLogs', { jobId })).sort((a, b) => b.start - a.start)[0]
const transfers = []
const walk = task => {
  if (task.message === 'transfer' && task.result?.size) transfers.push(task)
  ;(task.tasks ?? []).forEach(walk)
}
walk(log)
const size = transfers.reduce((a, t) => a + t.result.size, 0)
const tStart = Math.min(...transfers.map(t => t.start))
const tEnd = Math.max(...transfers.map(t => t.end))
const groups = {}
for (const { comm, ticks } of cpu.values()) {
  const g = comm.startsWith('V8Worker')
    ? 'gc/V8Worker'
    : comm.startsWith('libuv')
      ? 'libuv'
      : comm.startsWith('node') || comm.startsWith('MainThread')
        ? 'main'
        : 'other'
  groups[g] = (groups[g] ?? 0) + ticks / 100
}
const transferSec = (tEnd - tStart) / 1e3
console.log(
  JSON.stringify({
    label,
    status: log.status,
    GiB: +(size / 2 ** 30).toFixed(1),
    transferSec: +transferSec.toFixed(1),
    MiBps: Math.round(size / 2 ** 20 / transferSec),
    wallSec: +wall.toFixed(1),
    cpuSec: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, +v.toFixed(1)])),
    cpuPctOfTransfer: Object.fromEntries(
      Object.entries(groups).map(([k, v]) => [k, Math.round((v / transferSec) * 100)])
    ),
  })
)
await xo.call('backupNg.deleteJob', { id: jobId })
for (const s of Object.values(await xo.call('xo.getAllObjects', { filter: { type: 'VM-snapshot' } })).filter(
  s => s.$snapshot_of === VM
))
  await xo.call('vm.delete', { id: s.id })
execSync(`sudo -n rm -rf ${new URL(remote.url).pathname}/xo-vm-backups`)
await xo.close()
