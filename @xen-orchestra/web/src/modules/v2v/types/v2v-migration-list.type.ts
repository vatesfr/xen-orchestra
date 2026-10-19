import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import type { XoV2vVm } from '@vates/types'

export type V2vDestinationDefaults = {
  sr: FrontXoSr['id']
  network: FrontXoNetwork['id']
  template: FrontXoVmTemplate['id']
}

export type V2vMigrationListVm = {
  id: XoV2vVm['id']
}

export type V2vMigrationList = {
  version: 1
  sourceId: string
  poolId: FrontXoPool['id']
  defaults: V2vDestinationDefaults
  vms: V2vMigrationListVm[]
}

export type V2vMigrationListKey = Pick<V2vMigrationList, 'sourceId' | 'poolId'>
