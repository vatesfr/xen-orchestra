import type { Branded } from '@core/types/utility.type'
import type { XoBackupRepository } from '@vates/types'

export type XoMirrorBackup = {
  id: Branded<'backup-job'>
  type: 'mirrorBackup'
  mode: 'delta' | 'full'
  name: string
  remotes: {
    id: XoBackupRepository['id'] | { __or: XoBackupRepository['id'][] }
  }
  sourceRemote: XoBackupRepository['id']
}
