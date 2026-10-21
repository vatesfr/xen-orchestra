import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { getV2vPoolDestinationChoices } from '@/modules/v2v/utils/v2v-destination.util.ts'
import { useXoVmTemplateCollection } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useV2vPoolDestinationChoices(poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const { srs } = useXoSrCollection()

  const { networks } = useXoNetworkCollection()

  const { templates } = useXoVmTemplateCollection()

  return computed(() =>
    getV2vPoolDestinationChoices(toValue(poolId), {
      srs: srs.value,
      networks: networks.value,
      templates: templates.value,
    })
  )
}
