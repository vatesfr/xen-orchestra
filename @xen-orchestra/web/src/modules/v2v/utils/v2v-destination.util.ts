import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { V2vDestinationDefaults, V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { countOccurrences } from '@/shared/utils/count.util.ts'

export type V2vPoolResourceCounts = { hosts: number; srs: number; networks: number }

export type V2vDestinationPrefill = Partial<V2vDestinationDefaults>

export type V2vPoolDestinationChoices = ReturnType<typeof getV2vPoolDestinationChoices>

// SRs are counted the way they are offered: only writable ones can receive the migrated disks
export function countV2vPoolResources(
  pools: FrontXoPool[],
  resources: { hosts: FrontXoHost[]; srs: FrontXoSr[]; networks: FrontXoNetwork[] }
): Map<FrontXoPool['id'], V2vPoolResourceCounts> {
  const poolIds = pools.map(pool => pool.id)

  function countByPool(poolResources: { $pool: FrontXoPool['id'] }[]) {
    const resourcePoolIds = poolResources.map(resource => resource.$pool)

    return countOccurrences(poolIds, resourcePoolIds)
  }

  const hosts = countByPool(resources.hosts)
  const srs = countByPool(resources.srs.filter(isSrWritable))
  const networks = countByPool(resources.networks)

  return new Map(poolIds.map(id => [id, { hosts: hosts[id], srs: srs[id], networks: networks[id] }]))
}

// The SRs and networks of a migrated VM must belong to its destination pool (spec)
export function getV2vPoolDestinationChoices(
  poolId: FrontXoPool['id'] | undefined,
  resources: { srs: FrontXoSr[]; networks: FrontXoNetwork[]; templates: FrontXoVmTemplate[] }
) {
  const isInPool = ({ $pool }: { $pool: FrontXoPool['id'] }) => poolId !== undefined && $pool === poolId

  return {
    srs: resources.srs.filter(sr => isInPool(sr) && isSrWritable(sr)),
    networks: resources.networks.filter(isInPool),
    templates: resources.templates.filter(isInPool),
  }
}

export function findOfferedId<TId>(choices: { id: TId }[], id: TId | undefined): TId | undefined {
  return choices.find(choice => choice.id === id)?.id
}

// A select only shows a value once it offers it: a prefill set before its option exists would read empty, and a
// default gone from the pool would be kept unseen
export function getOfferedV2vDestinationPrefill(
  prefill: V2vDestinationPrefill,
  { srs, networks, templates }: V2vPoolDestinationChoices
): V2vDestinationPrefill {
  return {
    sr: findOfferedId(srs, prefill.sr),
    network: findOfferedId(networks, prefill.network),
    template: findOfferedId(templates, prefill.template),
  }
}

export function getV2vPoolManagementNetworkId(pool: FrontXoPool, pifs: FrontXoPif[]): FrontXoNetwork['id'] | undefined {
  return pifs.find(pif => pif.$host === pool.master && pif.management)?.$network
}

// Same prefill as XO 5: the pool default SR and the management network of the pool master. A list already
// stored for this pool keeps the defaults the user chose
export function getV2vDestinationPrefill(
  pool: FrontXoPool,
  { srs, pifs }: { srs: FrontXoSr[]; pifs: FrontXoPif[] },
  storedList: V2vMigrationList | undefined
): V2vDestinationPrefill {
  if (storedList !== undefined) {
    return storedList.defaults
  }

  const defaultSr = srs.find(sr => sr.id === pool.default_SR && sr.$pool === pool.id)

  return {
    sr: defaultSr !== undefined && isSrWritable(defaultSr) ? defaultSr.id : undefined,
    network: getV2vPoolManagementNetworkId(pool, pifs),
    template: undefined,
  }
}
