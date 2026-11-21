import type { V2vPoolDestinationChoices } from '@/modules/v2v/utils/v2v-destination.util.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { V2V_DEFAULT_OFFERS } from '@/test/v2v-mapping-fixtures.ts'
import { V2V_LIST_POOL, V2V_OTHER_POOL } from '@/test/v2v-wizard-fixtures.ts'

// The pool of the list, offering its VMs `offers` (none of a kind left out), in the mocked destination collections
export function seedV2vListPool({
  offers = V2V_DEFAULT_OFFERS,
  withOtherPool = false,
}: { offers?: Partial<V2vPoolDestinationChoices>; withOtherPool?: boolean } = {}) {
  xoCollectionsMock.pools.value = withOtherPool ? [V2V_LIST_POOL, V2V_OTHER_POOL] : [V2V_LIST_POOL]
  xoCollectionsMock.srs.value = offers.srs ?? []
  xoCollectionsMock.networks.value = offers.networks ?? []
  xoCollectionsMock.templates.value = offers.templates ?? []
}
