import { createPredicate } from 'value-matcher'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.js'
import { forbiddenOperation } from 'xo-common/api-errors.js'

export default async function backupGuard(poolId) {
  const jobs = await this.getAllJobs('backup')
  const guard = id => {
    if (this.getObject(id).$poolId === poolId) {
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
