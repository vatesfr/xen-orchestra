import type { XoHost, XoVm } from '@vates/types'

export interface MigrationEntry {
  vmId: XoVm['id']
  vmName: string
  currentHostId: XoHost['id']
  currentHostName: string
  targetHostId: XoHost['id']
  targetHostName: string
  reason: 'affinity' | 'anti-affinity'
  group: string
}
