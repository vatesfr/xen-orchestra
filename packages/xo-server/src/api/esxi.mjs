import { tmpdir } from 'node:os'
import { join } from 'path'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { VDDK_LIB_DIR } from '@xen-orchestra/vmware-explorer/esxi.mjs'
import { exec } from 'node:child_process'

function execPromise(command, opts = []) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 10 * 1024 * 1024, ...opts }, (error, stdout) => {
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
  await execPromise(`tar xfz ${tempFilePath} -C ${VDDK_LIB_DIR}`)
}
export async function installVddkLib() {
  return {
    $sendTo: await this.registerHttpRequest(handleImport),
  }
}
installVddkLib.params = {}

installVddkLib.permission = 'admin'

async function install({ repository, version, executable }) {
  const tmpDir = await fs.mkdtemp(join(tmpdir(), 'xo-server'))
  const libPath = await execPromise(`which ${executable}`).catch(() => {})
  if (libPath) {
    throw new Error(
      `${executable} is already installed at ${libPath} on this system please uninstall before rerunning this script`
    )
  }
  let id
  if ((id = (await execPromise('id -u')).trim() !== '0')) {
    throw new Error(`install script can only be run as root ${id}`)
  }
  try {
    await execPromise('apt-get --version')
  } catch (err) {
    const error = new Error(`The ${executable} auto install can only be run on a debian based system`)
    error.cause = err
    throw err
  }

  await execPromise('apt-get install -y git dh-autoreconf pkg-config make libxml2-dev ocaml libc-bin')

  await execPromise(`git clone ${repository} ${tmpDir}`)
  await execPromise(`git checkout ${version} `, { cwd: tmpDir })

  await execPromise('autoreconf -i > autoreconf.log', { cwd: tmpDir })
  await execPromise('./configure > autoreconf.log', { cwd: tmpDir })
  await execPromise('make', { cwd: tmpDir })
  await execPromise('make install', { cwd: tmpDir })
  await execPromise('ldconfig', { cwd: tmpDir })
  await execPromise(`${executable} --version`)
}

export async function installNbdInfoFromSource() {
  await install({ executable: 'nbdinfo', repository: 'https://gitlab.com/nbdkit/libnbd.git', version: 'v1.23.4' })
}

installNbdInfoFromSource.params = {}
installNbdInfoFromSource.permission = 'admin'

export async function installNbdKitFromSource() {
  await install({ executable: 'nbdkit', repository: 'https://gitlab.com/nbdkit/nbdkit.git', version: 'v1.44.3' })
}

installNbdKitFromSource.params = {}
installNbdKitFromSource.permission = 'admin'
