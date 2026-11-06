import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createManagementPif } from '@/test/create-pif.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { uniqBy } from 'lodash-es'

export type V2vDestinationPoolSeed = { pool: FrontXoPool; managementNetworkId: FrontXoNetwork['id'] }

// A default is only prefilled once offered: each pool offers its default SR and the management network of its master,
// and the network and template of `createV2vDestinationDefaults()` are offered as well
export function seedV2vDestinationPools(seeds: V2vDestinationPoolSeed[]) {
  xoCollectionsMock.pools.value = seeds.map(({ pool }) => pool)
  xoCollectionsMock.srs.value = seeds.map(({ pool }) => createSr({ id: pool.default_SR, $pool: pool.id }))
  xoCollectionsMock.networks.value = uniqBy(
    [
      createNetwork(),
      ...seeds.map(({ pool, managementNetworkId }) => createNetwork({ id: managementNetworkId, $pool: pool.id })),
    ],
    'id'
  )
  xoCollectionsMock.pifs.value = seeds.map(({ pool, managementNetworkId }) =>
    createManagementPif(pool, managementNetworkId)
  )
  xoCollectionsMock.templates.value = [createVmTemplate()]
}
