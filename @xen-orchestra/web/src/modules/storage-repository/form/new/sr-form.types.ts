import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { SrAccessMode } from '@core/types/storage-repository.type.ts'

export type NewSrFormData = {
  poolId: FrontXoPool['id'] | undefined
  hostId: FrontXoHost['id'] | undefined
  accessMode: SrAccessMode
  name: string
  description: string
}
