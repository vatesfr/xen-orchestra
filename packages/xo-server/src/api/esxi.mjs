import { execFile } from 'node:child_process'
import { getBundledPackage } from '@xen-orchestra/vmware-explorer/_vectura.mjs'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'

import { noop, safeDateFormat } from '../utils.mjs'

function execFilePromise(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { maxBuffer: 10 * 1024 * 1024, ...opts }, (error, stdout) => {
      if (error) {
        reject(error)
      } else {
        resolve(stdout)
      }
    })
  })
}

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

/**
 * Installs the vectura package shipped with `@xen-orchestra/vmware-explorer`.
 *
 * The package is bundled and not downloaded: the binary xo-server installs is the one it was tested
 * against, and an air gapped installation works the same way.
 */
export async function installVectura() {
  return Task.run({ properties: { name: 'installing vectura' } }, async () => {
    const { path, version } = await getBundledPackage()

    await Task.run({ properties: { name: 'check the system is debian based' } }, async () => {
      try {
        await execFilePromise('dpkg', ['--version'])
      } catch (error) {
        const wrapped = new Error('vectura can only be installed automatically on a debian based system')
        wrapped.cause = error
        throw wrapped
      }
    })

    await Task.run({ properties: { name: 'check the user is root' } }, async () => {
      const uid = (await execFilePromise('id', ['-u'])).trim()
      if (uid !== '0') {
        throw new Error(`vectura can only be installed by root, this process runs as uid ${uid}`)
      }
    })

    // a previous version would make `dpkg --install` a downgrade, which it refuses without
    // `--force-downgrade`. Removing first also covers a half configured package
    await Task.run({ properties: { name: 'remove a previous version' } }, () =>
      execFilePromise('dpkg', ['--remove', 'vectura']).catch(noop)
    )

    await Task.run({ properties: { name: `install vectura ${version}` } }, () =>
      execFilePromise('dpkg', ['--install', path])
    )

    await Task.run({ properties: { name: 'version check' } }, () => execFilePromise('vectura', ['--version']))
  })
}

installVectura.params = {}

installVectura.permission = 'admin'

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
