import { tmpdir } from 'node:os'
import { join } from 'path'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { VDDK_LIB_DIR } from '@xen-orchestra/vmware-explorer/esxi.mjs'
import { exec } from 'node:child_process'

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
  return this.checkVddkDependencies()
}

checkInstall.params = {}

checkInstall.permission = 'admin'

async function handleImport(req, res) {
  const tmpDir = await fs.mkdtemp(join(tmpdir(), 'xo-server'))
  const tempFilePath = join(tmpDir, 'vix.tar.gz')
  await fs.mkdir(VDDK_LIB_DIR, { recursive: true })
  await new Promise((resolve, reject) => {
    req.pipe(createWriteStream(tempFilePath))
    req.on('end', resolve)
    req.on('error', reject)
  })
  return new Promise((resolve, reject) => {
    exec(`tar xfz ${tempFilePath} -C ${VDDK_LIB_DIR}`, { maxBuffer: 10 * 1024 * 1024 }, err => {
      if (err) {
        reject(err)
      } else {
        res.end()
        return resolve()
      }
    })
  })
}
export async function installVddkLib() {
  return {
    $sendTo: await this.registerHttpRequest(handleImport),
  }
}
installVddkLib.params = {}

installVddkLib.permission = 'admin'
