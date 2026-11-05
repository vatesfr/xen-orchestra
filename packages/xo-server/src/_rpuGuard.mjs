import { forbiddenOperation } from 'xo-common/api-errors.js'

const runningPools = new Set()

/**
 * Ensures a single rolling pool update/reboot at a time per pool.
 *
 * @param {string} poolId - Identifier of the pool to lock
 * @param {string} operation - Name of the calling operation, used in the error
 * @returns {() => void} Release function, to be called in a `finally`
 * @throws {Error} `forbiddenOperation` if an RPU/RPR is already running on this pool
 */
export function acquireRpuGuard(poolId, operation) {
  if (runningPools.has(poolId)) {
    throw forbiddenOperation(operation, `a rolling pool update or reboot is already running on pool ${poolId}`)
  }
  runningPools.add(poolId)
  return () => runningPools.delete(poolId)
}
