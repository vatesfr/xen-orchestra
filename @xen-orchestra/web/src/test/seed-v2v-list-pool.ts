import type { V2vPoolDestinationChoices } from '@/modules/v2v/utils/v2v-destination.util.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { V2V_DEFAULT_OFFERS } from '@/test/v2v-mapping-fixtures.ts'
import { V2V_LIST_POOL } from '@/test/v2v-wizard-fixtures.ts'

// The pool of the list, offering its VMs `offers`, in the mocked destination collections
export function seedV2vListPool(offers: V2vPoolDestinationChoices = V2V_DEFAULT_OFFERS) {
  xoCollectionsMock.pools.value = [V2V_LIST_POOL]
  xoCollectionsMock.seedChoices(offers)
}
