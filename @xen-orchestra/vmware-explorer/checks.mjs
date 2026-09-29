import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { VECTURA_BIN } from './_vectura.mjs'

/**
 * Whether the vectura binary shipped with this package runs on this machine.
 *
 * There is nothing to install: this only fails when the binary lost its executable bit or when the
 * system is too old for it (glibc before 2.34).
 *
 * @returns {Promise<Object>}
 */
async function vectura() {
  try {
    await promisify(execFile)(VECTURA_BIN, ['--version'])
    return { status: 'success' }
  } catch (error) {
    return { error: `vectura is not runnable: ${error.message}`, status: 'error' }
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
