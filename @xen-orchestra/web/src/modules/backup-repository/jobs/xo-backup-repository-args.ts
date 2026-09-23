import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoBackupRepositoryArg = defineJobArg({
  identify: (br: FrontXoBackupRepository) => br.id,
  toArray: false,
})
