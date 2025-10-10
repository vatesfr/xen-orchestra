import { tmpdir } from 'node:os'
import { join } from 'path'
import fs from 'node:fs/promises'
import { createWriteStream } from 'node:fs'
import { VDDK_LIB_DIR } from '@xen-orchestra/vmware-explorer/esxi.mjs'
import { exec } from 'node:child_process'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import { format } from 'json-rpc-peer'

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
  return Task.run({ properties: { name: 'handling vddk import and installing' } }, async () => {
    const tmpDir = await Task.run({ properties: { name: `create directory` } }, () =>
      fs.mkdtemp(join(tmpdir(), 'xo-server'))
    )
    Task.info(`temp directory is ${tmpDir}`)
    const tempFilePath = join(tmpDir, 'vix.tar.gz')
    Task.info(`temp upload path  is ${tempFilePath}`)
    await Task.run({ properties: { name: `create vddk lib directory` } }, () =>
      fs.mkdir(VDDK_LIB_DIR, { recursive: true })
    )

    await Task.run(
      { properties: { name: 'uploading file' } },
      () =>
        new Promise((resolve, reject) => {
          req.pipe(createWriteStream(tempFilePath))
          req.on('end', resolve)
          req.on('error', reject)
        })
    )
    await Task.run({ properties: { name: `installing to ${VDDK_LIB_DIR}` } }, () =>
      execPromise(`tar xfz ${tempFilePath} -C ${VDDK_LIB_DIR}`)
    )
    res.end(format.response(0))
  })
}
export async function installVddkLib() {
  return {
    $sendTo: await this.registerHttpRequest(handleImport),
  }
}
installVddkLib.params = {}

installVddkLib.permission = 'admin'

async function install({ repository, version, executable }) {
  const tmpDir = await Task.run({ properties: { name: `create directory` } }, () => {
    return fs.mkdtemp(join(tmpdir(), 'xo-server'))
  })

  Task.info(`temp directory is ${tmpDir}`)
  await Task.run({ properties: { name: `check if nbdinfo is already connected` } }, async () => {
    const libPath = await execPromise(`which ${executable}`).catch(() => {})
    if (libPath) {
      throw new Error(
        `${executable} is already installed at ${libPath} on this system please uninstall before rerunning this script`
      )
    }
  })

  await Task.run({ properties: { name: `check if user is root` } }, async () => {
    let id
    if ((id = (await execPromise('id -u')).trim() !== '0')) {
      throw new Error(`install script can only be run as root ${id}`)
    }
  })

  await Task.run({ properties: { name: `check if os is debian based` } }, async () => {
    try {
      await execPromise('apt-get --version')
    } catch (err) {
      const error = new Error(`The ${executable} auto install can only be run on a debian based system`)
      error.cause = err
      throw err
    }
  })

  await Task.run({ properties: { name: `updating apt repositories` } }, () => execPromise('apt update')).catch(err => Task.warning('Error while updating system', {err}))

  await Task.run({ properties: { name: `installing dependencies` } }, () =>
    execPromise('apt-get install -y git dh-autoreconf pkg-config make libxml2-dev ocaml libc-bin')
  )

  await Task.run({ properties: { name: `cloning repo` } }, () => execPromise(`git clone ${repository} ${tmpDir}`))
  await Task.run({ properties: { name: `switching to version ${version}` } }, () =>
    execPromise(`git checkout ${version} `, { cwd: tmpDir })
  )

  await Task.run({ properties: { name: `running autoreconf` } }, () =>
    execPromise('autoreconf -i >  autoreconf.log', { cwd: tmpDir })
  )
  await Task.run({ properties: { name: `running configure` } }, () =>
    execPromise('./configure > configure.log', { cwd: tmpDir })
  )
  await Task.run({ properties: { name: `compiling` } }, () => execPromise('make', { cwd: tmpDir }))

  await Task.run({ properties: { name: `installing` } }, () => execPromise('make install', { cwd: tmpDir }))

  await Task.run({ properties: { name: `linking` } }, () => execPromise('ldconfig', { cwd: tmpDir }))

  await Task.run({ properties: { name: `version check ` } }, () => execPromise(`${executable} --version`))
}

export async function installNbdInfoFromSource() {
  await Task.run({ properties: { name: 'Compile and installl nbdinfo' } }, async () => {
    await install({ executable: 'nbdinfo', repository: 'https://gitlab.com/nbdkit/libnbd.git', version: 'v1.23.4' })
  })
}

installNbdInfoFromSource.params = {}
installNbdInfoFromSource.permission = 'admin'

export async function installNbdKitFromSource() {
  await Task.run({ properties: { name: 'Compile and installl nbdkit' } }, async () => {
    await install({ executable: 'nbdkit', repository: 'https://gitlab.com/nbdkit/nbdkit.git', version: 'v1.44.3' })
  })
}

installNbdKitFromSource.params = {}
installNbdKitFromSource.permission = 'admin'
