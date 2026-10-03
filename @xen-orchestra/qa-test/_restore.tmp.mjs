// TEMPORARY: times backup restores through XO, then deletes the restored VMs
import { xoConnection } from './client/xoLibClient.js'
const SR = '0a68c8d2-4a53-9d2a-9535-9b3fe830e10a' // forcair Local storage (SN850X)
const ids = process.argv.slice(2)
const xo = await xoConnection({ xoUrl: 'http://localhost', username: 'admin@admin.net', password: 'admin' })
for (const id of ids) {
  const t0 = performance.now()
  const vmId = await xo.call('backupNg.importVmBackup', { id, sr: SR, settings: {} })
  const s = (performance.now() - t0) / 1e3
  console.log(JSON.stringify({ backup: id.split('//')[0].slice(0, 8), vm: vmId, sec: +s.toFixed(1) }))
  await xo.call('vm.delete', { id: vmId, deleteDisks: true })
}
await xo.close()
