import type { XoProxy } from '@/types/xo/proxy.type.ts'
import type { Branded } from '@vates/types'

export type XoBackupRepository = {
  id: Branded<'backup-repository'>
  enabled: boolean
  name: string
  options?: string
  proxy?: XoProxy['id']
  url: string
  physical_usage: number
  size: number
}
