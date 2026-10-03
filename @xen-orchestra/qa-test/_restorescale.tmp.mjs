// TEMPORARY: restore of the "QA scale" backup (3 x 20 GiB + system), CPU per thread of the xo-server process
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { xoConnection } from './client/xoLibClient.js'
const VM = '8f50a1fa-f7a9-b9ab-1d71-f26d6017b35b'
const TARGET_SR = process.argv[2] ?? '29b9f7db-25e9-e068-65e1-0afd793927ff' // diskor Local storage
const runs = Number(process.argv[3] ?? 2)
const xo = await xoConnection({ xoUrl: 'http://localhost', username: 'admin@admin.net', password: 'admin' })
const remote = (await xo.call('remote.getAll')).find(r => r.name === (process.env.REMOTE_NAME ?? 'Test backup QA'))
const jobId = await xo.call('backupNg.createJob', {
  name: 'QA scale restore source',
  mode: 'delta',
  vms: { id: VM },
  remotes: { id: remote.id },
  schedules: { tmp: { cron: '0 0 1 1 *', enabled: false, name: '' } },
  settings: {
    '': { preferNbd: true, nbdConcurrency: 1, timezone: 'Europe/Paris' },
    tmp: { exportRetention: 1, fullInterval: 1 },
  },
})
const schedule = (await xo.call('schedule.getAll')).find(s => s.jobId === jobId)
let backup
try {
  await xo.call('backupNg.runJob', { id: jobId, schedule: schedule.id })
  backup = (await xo.call('backupNg.listVmBackups', { remotes: [remote.id] }))[remote.id]?.[VM]?.[0]
} finally {
  if (backup === undefined) await xo.call('backupNg.deleteJob', { id: jobId })
}
if (backup === undefined) throw new Error('the backup failed')
const pid = execSync('systemctl show -p MainPID --value xo-server').toString().trim()
const threads = () => {
  const out = new Map()
  for (const tid of fs.readdirSync(`/proc/${pid}/task`)) {
    try {
      const comm = fs.readFileSync(`/proc/${pid}/task/${tid}/comm`, 'utf8').trim()
      const f = fs.readFileSync(`/proc/${pid}/task/${tid}/stat`, 'utf8').split(') ')[1].split(' ')
      out.set(tid, { comm, ticks: Number(f[11]) + Number(f[12]) })
    } catch {}
  }
  return out
}
try {
  for (let i = 0; i < runs; i++) {
    const before = threads()
    const t0 = performance.now()
    const restored = await xo.call('backupNg.importVmBackup', { id: backup.id, sr: TARGET_SR, settings: {} })
    const wall = (performance.now() - t0) / 1e3
    const after = threads()
    const groups = {}
    for (const [tid, { comm, ticks }] of after) {
      const g = comm.startsWith('V8Worker')
        ? 'gc/V8Worker'
        : comm.startsWith('libuv')
          ? 'libuv'
          : tid === pid
            ? 'main'
            : 'other'
      groups[g] = (groups[g] ?? 0) + (ticks - (before.get(tid)?.ticks ?? 0)) / 100
    }
    const log = Object.values(await xo.call('backupNg.getLogs', {}))
      .filter(l => l.message === 'restore')
      .sort((a, b) => b.start - a.start)[0]
    const transfer = (log.tasks ?? []).find(t => t.message === 'transfer') ?? log
    const sec = (transfer.end - transfer.start) / 1e3
    const size = transfer.result?.size ?? log.result?.size
    console.log(
      JSON.stringify({
        run: i + 1,
        status: log.status,
        GiB: +(size / 2 ** 30).toFixed(1),
        transferSec: +sec.toFixed(1),
        MiBps: Math.round(size / 2 ** 20 / sec),
        wallSec: +wall.toFixed(1),
        cpuPctOfTransfer: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, Math.round((v / sec) * 100)])),
      })
    )
    await xo.call('vm.delete', { id: restored, deleteDisks: true })
  }
} finally {
  await xo.call('backupNg.deleteJob', { id: jobId })
  for (const s of Object.values(await xo.call('xo.getAllObjects', { filter: { type: 'VM-snapshot' } })).filter(
    s => s.$snapshot_of === VM
  ))
    await xo.call('vm.delete', { id: s.id })
  execSync(`sudo -n rm -rf ${new URL(remote.url).pathname}/xo-vm-backups`)
  await xo.close()
}
