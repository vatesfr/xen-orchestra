import { createLogger } from '@xen-orchestra/log'
import { createPredicate } from 'value-matcher'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { forbiddenOperation } from 'xo-common/api-errors.js'

const log = createLogger('xo:api:backup-guard')

/**
 * Refuses an operation while a backup job runs, or may run, on the pool.
 *
 * Must be called with `this` set to the xo-server instance.
 *
 * @param {string} poolId
 * @param {object} [opts]
 * @param {boolean} [opts.bypassBackupCheck=false] - Skip the check, the bypass is logged
 * @param {string} opts.operation - Name of the calling operation, for the log
 * @throws {Error} `forbiddenOperation` if a backup runs or may run on the pool
 */
export default async function backupGuard(poolId, { bypassBackupCheck = false, operation } = {}) {
  if (bypassBackupCheck) {
    log.warn(`${operation} with "bypassBackupCheck" set to true, skipping the backup guard`, {
      poolId,
      userId: this.apiContext?.user?.id,
    })
    return
  }

  const jobs = await this.getAllJobs('backup')
  const guard = id => {
    // a VM deleted since the job was configured cannot be backed up on this pool
    if (this.hasObject(id) && this.getObject(id).$poolId === poolId) {
      throw forbiddenOperation('Backup is running', `A backup is running on the pool: ${poolId}`)
    }
  }

  jobs.forEach(({ runId, vms }) => {
    // If runId is undefined, the job is not currently running.
    if (runId !== undefined) {
      if (vms.id !== undefined) {
        extractIdsFromSimplePattern(vms).forEach(guard)
      } else {
        // smartmode
        // For the smartmode we take a simplified approach :
        // if the smartmode is explicitly 'resident' or 'not resident' on pools : we check if it concern this pool
        // if not, the job  may concern this pool and we show the warning without looking through all the impacted VM

        const isPoolSafe = vms.$pool === undefined ? false : !createPredicate(vms.$pool)(poolId)
        if (!isPoolSafe) {
          throw forbiddenOperation('May have running backup', `A backup may run on the pool: ${poolId}`)
        }
      }
    }
  })
}
