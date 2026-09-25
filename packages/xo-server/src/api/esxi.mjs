import { noop, safeDateFormat } from '../utils.mjs'

export function listVms({ host, password, sslVerify = true, user }) {
  return this.connectToEsxiAndList({ host, user, password, sslVerify })
}

listVms.params = {
  host: { type: 'string' },
  user: { type: 'string' },
  password: { type: 'string' },
  sslVerify: { type: 'boolean', optional: true },
}

listVms.permission = 'admin'

export function checkInstall() {
  return this.checkEsxiDependencies()
}

checkInstall.params = {}

checkInstall.permission = 'admin'

async function handleExport(req, res, { disk, format, host, password, user, vm }) {
  const stream = await this.exportEsxiDisk({ disk, format, host, user, password, vm })

  res.on('close', () => stream.on('error', noop).destroy())

  res.setHeader('content-disposition', 'attachment')
  stream.pipe(res)
}

export async function exportDisk({ disk, format = 'qcow2', host, password, user, vm }) {
  return {
    $getFrom: await this.registerHttpRequest(
      handleExport,
      {
        disk,
        format,
        host,
        password,
        user,
        vm,
      },
      {
        suffix: '/' + encodeURIComponent(`${safeDateFormat(new Date())} - ${vm.name_label}.${format}`),
      }
    ),
  }
}

exportDisk.params = {
  format: { type: 'string', optional: true },
  host: { type: 'string' },
  password: { type: 'string' },
  stopSource: { type: 'boolean', optional: true },
  user: { type: 'string' },
  vm: { type: 'string' },
  disk: { type: 'string', optional: true },
}
exportDisk.permission = 'admin'

export async function importDisk({ disk, format, host, password, sslVerify, sr, user, vm }) {
  return this.importEsxiDiskToSr({ disk, format, host, user, password, sslVerify, sr, vm })
}

importDisk.params = {
  disk: { type: 'string' },
  format: { type: 'string', optional: true },
  host: { type: 'string' },
  password: { type: 'string' },
  sr: { type: 'string' },
  sslVerify: { type: 'boolean', optional: true },
  user: { type: 'string' },
  vm: { type: 'string' },
}
importDisk.permission = 'admin'
