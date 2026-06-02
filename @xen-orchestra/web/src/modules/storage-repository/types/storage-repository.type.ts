import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'

export type SrScope = { type: 'pool' } | { type: 'host'; hostId: FrontXoHost['id'] }

export type SrAccessMode = 'local' | 'shared' | 'mixed'
