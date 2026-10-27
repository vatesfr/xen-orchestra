import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { defineJobArg } from '@core/packages/job'

export const xoBackupRepositoryArg = defineJobArg({
  identify: (br: FrontXoBackupRepository) => br.id,
  toArray: false,
})

export const xoBackupRepositoriesArg = defineJobArg({
  identify: (br: FrontXoBackupRepository) => br.id,
  toArray: true,
})

export const xoBackupRepositoryEnabledArg = defineJobArg<boolean>({
  identify: false,
  toArray: false,
})
