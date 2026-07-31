import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { SDN_CONTROLLER_OF_METHOD_KEY } from '@vates/types'

export function isNetworkRuleSupported(pool: FrontXoPool | undefined): boolean {
  const ofMethod = pool?.otherConfig[SDN_CONTROLLER_OF_METHOD_KEY]

  return ofMethod !== 'channel'
}
