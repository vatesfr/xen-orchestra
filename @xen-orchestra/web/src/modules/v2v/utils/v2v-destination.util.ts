import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isSrWritable, isWritableSrOfPool } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { V2vDestinationDefaults, V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { countBy } from 'lodash-es'

export type V2vPoolResourceCounts = { hosts: number; srs: number; networks: number }

export type V2vDestinationPrefill = Partial<V2vDestinationDefaults>

export type V2vPoolDestinationChoices = ReturnType<typeof getV2vPoolDestinationChoices>

// SRs are counted the way they are offered: only writable ones can receive the migrated disks
export function countV2vPoolResources(
  pools: FrontXoPool[],
  resources: { hosts: FrontXoHost[]; srs: FrontXoSr[]; networks: FrontXoNetwork[] }
): Map<FrontXoPool['id'], V2vPoolResourceCounts> {
  const hosts = countBy(resources.hosts, '$pool')
  const srs = countBy(resources.srs.filter(isSrWritable), '$pool')
  const networks = countBy(resources.networks, '$pool')

  return new Map(pools.map(({ id }) => [id, { hosts: hosts[id] ?? 0, srs: srs[id] ?? 0, networks: networks[id] ?? 0 }]))
}

// The SRs and networks of a migrated VM must belong to its destination pool (spec)
export function getV2vPoolDestinationChoices(
  poolId: FrontXoPool['id'] | undefined,
  resources: { srs: FrontXoSr[]; networks: FrontXoNetwork[]; templates: FrontXoVmTemplate[] }
) {
  const isInPool = ({ $pool }: { $pool: FrontXoPool['id'] }) => poolId !== undefined && $pool === poolId

  return {
    srs: resources.srs.filter(sr => isWritableSrOfPool(sr, poolId)),
    networks: resources.networks.filter(isInPool),
    templates: resources.templates.filter(isInPool),
  }
}

function findOfferedId<TId>(choices: { id: TId }[], id: TId | undefined): TId | undefined {
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

  const defaultSr = srs.find(sr => sr.id === pool.default_SR && isWritableSrOfPool(sr, pool.id))

  return {
    sr: defaultSr?.id,
    network: getV2vPoolManagementNetworkId(pool, pifs),
    template: undefined,
  }
}
