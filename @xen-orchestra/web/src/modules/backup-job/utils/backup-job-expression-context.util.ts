import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryType } from '@/modules/backup-repository/utils/xo-backup-repository-type.util.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { BackupRepositoryType } from 'xo-remote-parser'

// Same shapes as `buildBackupRepositoryContext` and `buildSrContext` in @xen-orchestra/backups/_buildContext.mjs,
// which xo-server uses to resolve the target expressions of a backup job

export type BackupRepositoryExpressionContext = {
  name: string
  type: BackupRepositoryType | undefined
  tags: string[]
}

export type SrExpressionContext = {
  name_label: string
  type: string
  description: string
  tags: string[]
}

export function toBackupRepositoryExpressionContext(br: FrontXoBackupRepository): BackupRepositoryExpressionContext {
  return {
    name: br.name,
    type: getBackupRepositoryType(br.url),
    tags: [],
  }
}

export function toSrExpressionContext(sr: FrontXoSr): SrExpressionContext {
  return {
    name_label: sr.name_label,
    type: sr.SR_type,
    description: sr.name_description,
    tags: sr.tags,
  }
}
