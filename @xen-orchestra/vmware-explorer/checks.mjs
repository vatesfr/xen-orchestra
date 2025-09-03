import { exec } from 'node:child_process'
import semver from 'semver'
import fs from 'node:fs/promises'

const NBDKIT_VERSION_VDDK9 = '1.42.5'

/**
 *
 * @returns {Promise<Object>}
 */
/* async */ function nbdInfo() {
  return new Promise(function (resolve, reject) {
    const expectedVersion = '1.23.4'
    exec('nbdinfo --version', (error, stdout, stderr) => {
      if (error) {
        return resolve({
          error: `exit code ${error.code}`,
          status: 'error',
        })
      }
      const matches = stdout.match(/nbdinfo ([0-9.]+)/)
      const version = matches?.[1] ?? ''
      resolve({
        installed: true,
        version,
        status: semver.satisfies(version, `>=${expectedVersion}`) ? 'success' : 'alarm',
        expectedVersion,
      })
    })
  })
}

async function getNbdKitVersion() {
  return new Promise(function (resolve) {
    exec('nbdkit --version', (error, stdout, stderr) => {
      if (error) {
        return resolve({
          error: `exit code ${error.code}`,
          status: 'error',
        })
      }
      const matches = stdout.match(/nbdkit ([0-9.]+)/)
      const version = matches?.[1] ?? ''
      resolve(version)
    })
  })
}
/**
 *
 * @returns {Promise<Object>}
 */
async function nbdKit() {
  const expectedVersion = '1.42'
  try {
    const version = await getNbdKitVersion()
    return {
      installed: true,
      version,
      status: semver.satisfies(version, `>=${expectedVersion}`) ? 'success' : 'alarm',
      expectedVersion,
    }
  } catch (error) {
    return {
      error: `exit code ${error.code}`,
      status: 'error',
    }
  }
}

/**
 *
 * @returns {Promise<Object>}
 */
/* async */ function nbdKitVddk() {
  return new Promise(function (resolve) {
    exec('nbdkit --dump-plugin vddk', (error, stdout, stderr) => {
      if (error) {
        return resolve({
          error: stderr,
          status: 'error',
        })
      }
      resolve({
        status: 'success',
      })
    })
  })
}

/**
 *
 * @returns {Promise<Object>}
 */
async function vddk() {
  try {
    await fs.stat('/usr/local/lib/vddk/vmware-vix-disklib-distrib/lib64/libvixDiskLib.so')
  } catch (error) {
    return {
      status: 'error',
      error:
        'Vddk library is not present or accessible in /usr/local/lib/vddk/ it can be downloaded from https://developer.broadcom.com/sdks/vmware-virtual-disk-development-kit-vddk/latest',
    }
  }
  try {
    const isV9 = await fs.stat('/usr/local/lib/vddk/vmware-vix-disklib-distrib/lib64/libvixDiskLib.so.9')
    const nbdKitVersion = await getNbdKitVersion()
    if (isV9) {
      if (!semver.satisfies(nbdKitVersion, `>=${NBDKIT_VERSION_VDDK9}`)) {
        return {
          status: 'alarm',
          expectedVersion: '1.42.5',
          version: nbdKitVersion,
        }
      }
    }
  } catch (error) {
    // v8 and older are ok
  }
  return { status: 'success' }
}
/**
 *
 * @returns {Promise<Object>}
 */
export async function checkVddkDependencies() {
  return {
    nbdinfo: await nbdInfo(),
    nbdkit: await nbdKit(),
    nbdkitPluginVddk: await nbdKitVddk(),
    vddk: await vddk(),
  }
}
