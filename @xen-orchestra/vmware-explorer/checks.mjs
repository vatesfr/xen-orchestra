import { exec } from 'node:child_process'
import semver from 'semver'
import fs from 'node:fs/promises'

/**
 *
 * @returns {Promise<Object>}
 */
/* async */ function nbdInfos() {
  return new Promise(function (resolve, reject) {
    const expectedVersion = '1.23.4'
    exec('nbdinfo --version', (error, stdout, stderr) => {
      if (error) {
        return resolve({
          installed: false,
          error,
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
/**
 *
 * @returns {Promise<Object>}
 */
/* async */ function nbdKit() {
  const expectedVersion = '1.45'
  return new Promise(function (resolve) {
    exec('nbdkit --version', (error, stdout, stderr) => {
      if (error) {
        return resolve({
          installed: false,
          error,
          status: 'error',
        })
      }
      const matches = stdout.match(/nbdkit ([0-9.]+)/)
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
    return { status: 'success' }
  } catch (error) {
    return {
      status: 'error',
      error:
        'Vddk library is not present or accessible in /usr/local/lib/vddk/ it can be downloaded from https://developer.broadcom.com/sdks/vmware-virtual-disk-development-kit-vddk/latest',
    }
  }
}
/**
 *
 * @returns {Promise<Object>}
 */
export async function checkVddkDependencies() {
  return {
    nbdInfos: await nbdInfos(),
    nbdkit: await nbdKit(),
    nbdKitVddk: await nbdKitVddk(),
    vddk: await vddk(),
  }
}
