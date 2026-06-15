import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'

export type StorageScope = { type: 'pool' } | { type: 'host'; hostId: FrontXoHost['id'] }
