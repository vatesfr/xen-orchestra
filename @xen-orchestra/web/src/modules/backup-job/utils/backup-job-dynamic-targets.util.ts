import {
  ALL_EXPRESSION,
  BACKUP_REPOSITORY_EXPRESSION_KEY,
  STORAGE_REPOSITORY_EXPRESSION_KEY,
  toBackupRepositoryExpressionContext,
  toSrExpressionContext,
} from '@/modules/backup-job/utils/backup-job-expression-context.util.ts'
import { filterByQuery } from '@/modules/backup-job/utils/filter-by-query.util.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'

function filterByExpression<TItem>(
  items: TItem[],
  expression: string,
  key: string,
  toContext: (item: TItem) => unknown
): TItem[] {
  return expression === ALL_EXPRESSION ? items : filterByQuery(items, expression, item => ({ [key]: toContext(item) }))
}

export function getDynamicBackupRepositoryTargets(
  backupRepositories: FrontXoBackupRepository[],
  expression: string,
  proxy: FrontXoBackupRepository['proxy']
): FrontXoBackupRepository[] {
  return filterByExpression(
    backupRepositories.filter(br => br.enabled && br.proxy === proxy),
    expression,
    BACKUP_REPOSITORY_EXPRESSION_KEY,
    toBackupRepositoryExpressionContext
  )
}

export function getDynamicStorageRepositoryTargets(srs: FrontXoSr[], expression: string): FrontXoSr[] {
  return filterByExpression(
    srs.filter(isSrWritable),
    expression,
    STORAGE_REPOSITORY_EXPRESSION_KEY,
    toSrExpressionContext
  )
}
