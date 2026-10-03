// TEMPORARY: full backup of Project ventura on a test remote, then restore, both timed
// usage: node _compress.tmp.mjs <label> <remote url>   (the remote and the job are created then deleted)
import { execSync } from 'node:child_process'
import { xoConnection } from './client/xoLibClient.js'
const [label, url] = process.argv.slice(2)
const VM = '4c8f754c-a4ce-05ca-f52e-b81c23db3123' // Project ventura
const SR = '0a68c8d2-4a53-9d2a-9535-9b3fe830e10a' // forcair SN850X
const dir = new URL(url).pathname
const xo = await xoConnection({ xoUrl: 'http://localhost', username: 'admin@admin.net', password: 'admin' })
execSync(`sudo -n rm -rf ${dir}`)
const remote = await xo.call('remote.create', { name: `QA ${label}`, url })
const jobId = await xo.call('backupNg.createJob', {
  name: `QA ${label}`,
  mode: 'delta',
  vms: { id: VM },
  remotes: { id: remote.id },
  schedules: { tmp: { cron: '0 0 1 1 *', enabled: false, name: '' } },
  settings: { '': { preferNbd: true, nbdConcurrency: 2, timezone: 'Europe/Paris' }, tmp: { exportRetention: 1, fullInterval: 1 } },
})
const schedule = (await xo.call('schedule.getAll')).find(s => s.jobId === jobId)
try {
  let t0 = performance.now()
  await xo.call('backupNg.runJob', { id: jobId, schedule: schedule.id })
  const backupSec = (performance.now() - t0) / 1e3
  const stored = Number(execSync(`sudo -n du -sb ${dir}/xo-vm-backups`).toString().split('\t')[0])
  const backups = await xo.call('backupNg.listVmBackups', { remotes: [remote.id] })
  const backup = backups[remote.id][VM][0]
  let restoreSec = NaN
  if (process.env.SKIP_RESTORE !== '1') {
    t0 = performance.now()
    const restored = await xo.call('backupNg.importVmBackup', { id: backup.id, sr: SR, settings: {} })
    restoreSec = (performance.now() - t0) / 1e3
    await xo.call('vm.delete', { id: restored, deleteDisks: true })
  }
  const MiB = 2 ** 20
  console.log(JSON.stringify({ label, dataMiB: Math.round(backup.size / MiB), storedMiB: Math.round(stored / MiB), ratio: +(stored / backup.size).toFixed(3), backupSec: +backupSec.toFixed(1), backupMiBps: Math.round(backup.size / MiB / backupSec), restoreSec: +restoreSec.toFixed(1), restoreMiBps: Math.round(backup.size / MiB / restoreSec) }))
} finally {
  await xo.call('backupNg.deleteJob', { id: jobId })
  await xo.call('remote.delete', { id: remote.id })
  if (process.env.KEEP !== '1') execSync(`sudo -n rm -rf ${dir}`)
  // the snapshots kept by the delta backup of this job
  const snapshots = Object.values(await xo.call('xo.getAllObjects', { filter: { type: 'VM-snapshot' } })).filter(s => s.$snapshot_of === VM && s.other?.['xo:backup:job'] === jobId)
  for (const s of snapshots) await xo.call('vm.delete', { id: s.id })
  await xo.close()
}
