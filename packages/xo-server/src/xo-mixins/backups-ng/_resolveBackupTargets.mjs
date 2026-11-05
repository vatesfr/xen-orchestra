import { isSrWritable } from '../../utils.mjs'
import { buildSrContext, buildBackupRepositoryContext } from '@xen-orchestra/backups/_buildContext.mjs'
import { compileExpression } from '@xen-orchestra/backups/_expressionPredicate.mjs'

export function resolveBackupSrs(job, srs, runContext) {
  const predicate = compileExpression(job.srs)

  const srUuids = []
  srs.forEach(sr => {
    if (isSrWritable(sr) && predicate(buildSrContext(sr, runContext))) {
      srUuids.push(sr.uuid)
    }
  })

  return srUuids
}

export function resolveBackupRepositories(job, backupRepositories, runContext) {
  const predicate = compileExpression(job.remotes)

  const backupRepositoryIds = []
  const proxySkippedIds = []
  const invalidUrlIds = []
  backupRepositories.forEach(backupRepository => {
    if (!backupRepository.enabled) return

    const context = buildBackupRepositoryContext(backupRepository, runContext)
    if (predicate(context)) {
      if (context.backupRepository.type !== undefined) {
        if (backupRepository.proxy === job.proxy) {
          backupRepositoryIds.push(backupRepository.id)
        } else {
          proxySkippedIds.push(backupRepository.id)
        }
      } else {
        invalidUrlIds.push(backupRepository.id)
      }
    }
  })

  return { backupRepositoryIds, proxySkippedIds, invalidUrlIds }
}
