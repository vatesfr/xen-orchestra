import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { V2vMappingTargetNameGetters } from '@/modules/v2v/utils/v2v-selected-vm.util.ts'

// The names of the SRs and networks a mapping targets, as their collections know them
export function useV2vTargetNameGetters(): V2vMappingTargetNameGetters {
  const { getSrById } = useXoSrCollection()

  const { getNetworkById } = useXoNetworkCollection()

  return {
    getSrName: id => getSrById(id)?.name_label,
    getNetworkName: id => getNetworkById(id)?.name_label,
  }
}
