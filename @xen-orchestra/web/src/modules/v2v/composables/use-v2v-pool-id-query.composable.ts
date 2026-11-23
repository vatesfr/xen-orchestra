import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vIdQuery } from '@/modules/v2v/composables/use-v2v-id-query.composable.ts'

// The destination pool lives in the route: a reload or a shared link reopens the wizard on it
export function useV2vPoolIdQuery() {
  return useV2vIdQuery<FrontXoPool['id']>('pool')
}
