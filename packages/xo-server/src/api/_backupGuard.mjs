import { createLogger } from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { forbiddenOperation } from 'xo-common/api-errors.js'

const log = createLogger('xo:api:backup-guard')

/**
 * Refuses an operation on an object while a backup job runs, or may run, on its pool.
 *
 * Must be called with `this` set to the xo-server instance.
 *
 * @param {string} objectId - ID of the XO object targeted by the operation (host, SR, pool…)
 * @param {object} [opts]
 * @param {boolean} [opts.bypassBackupCheck=false] - Skip the check, the bypass is logged
 * @param {string} opts.operation - Name of the calling operation, for the log
 * @throws {Error} `forbiddenOperation` if a backup runs or may run on the pool of the object
 */
export default async function backupGuard(objectId, { bypassBackupCheck = false, operation } = {}) {
  const { $pool: poolId } = this.getObject(objectId)

  if (bypassBackupCheck) {
    log.warn(`${operation} with "bypassBackupCheck" set to true, skipping the backup guard`, {
      objectId,
      poolId,
      userId: this.apiContext?.user?.id,
    })
    return
  }

  const [job] = listRunningBackupJobs(this, poolId, await this.getAllJobs('backup'))
  if (job !== undefined) {
    throw job.mayRun
      ? forbiddenOperation('May have running backup', `A backup may run on the pool: ${poolId}`)
      : forbiddenOperation('Backup is running', `A backup is running on the pool: ${poolId}`)
  }
}

/**
 * Lists the backup jobs which run, or may run, on a pool: the ones `backupGuard` refuses an operation for.
 *
 * @param {object} app - The xo-server instance
 * @param {string} poolId
 * @param {object[]} jobs - The backup jobs
 * @returns {{ id: string, mayRun: boolean }[]} `mayRun`: the job runs, but whether it concerns the pool is not known
 */
export function listRunningBackupJobs(app, poolId, jobs) {
  const runningJobs = []
  jobs.forEach(({ id, runId, vms }) => {
    // If runId is undefined, the job is not currently running.
    if (runId !== undefined) {
      if (vms.id !== undefined) {
        // a VM deleted since the job was configured cannot be backed up on this pool
        if (
          extractIdsFromSimplePattern(vms).some(vmId => app.hasObject(vmId) && app.getObject(vmId).$pool === poolId)
        ) {
          runningJobs.push({ id, mayRun: false })
        }
      } else {
        // smartmode
        // For the smartmode we take a simplified approach :
        // if the smartmode is explicitly 'resident' or 'not resident' on pools : we check if it concern this pool
        // if not, the job  may concern this pool and we show the warning without looking through all the impacted VM

        const isPoolSafe = vms.$pool === undefined ? false : !createPredicate(vms.$pool)(poolId)
        if (!isPoolSafe) {
          runningJobs.push({ id, mayRun: true })
        }
      }
    }
  })
  return runningJobs
}
