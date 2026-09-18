import { exec } from 'node:child_process'

import { getBundledPackage } from './_vectura.mjs'

/**
 * Version of the vectura binary on this machine.
 *
 * @returns {Promise<string>} rejects when it is not installed or not runnable
 */
/* async */ function getVecturaVersion() {
  return new Promise(function (resolve, reject) {
    exec('vectura --version', (error, stdout) => {
      if (error) {
        return reject(error)
      }
      const matches = stdout.match(/vectura ([0-9.]+)/)
      if (matches === null) {
        return reject(new Error(`can't read the version of vectura in ${JSON.stringify(stdout)}`))
      }
      resolve(matches[1])
    })
  })
}

/**
 * Whether the installed vectura is the one shipped with this package.
 *
 * The two are compared for equality and not with a range: the package holds the binary xo-server is
 * tested against, so anything else — older or newer — is worth reporting.
 *
 * @returns {Promise<Object>}
 */
async function vectura() {
  const { version: expectedVersion } = await getBundledPackage()

  let version
  try {
    version = await getVecturaVersion()
  } catch (error) {
    return {
      error: `vectura is not installed or not runnable: ${error.message}`,
      expectedVersion,
      status: 'error',
    }
  }

  return {
    installed: true,
    version,
    status: version === expectedVersion ? 'success' : 'alarm',
    expectedVersion,
  }
}

/**
 * Everything the import of a VM from an ESXi host needs on this machine.
 *
 * @returns {Promise<Object>}
 */
export async function checkDependencies() {
  return {
    vectura: await vectura(),
  }
}
