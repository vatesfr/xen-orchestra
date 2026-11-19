import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { useXoNetworkCollection } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { isWritableSrOfPool } from '@/modules/storage-repository/utils/xo-sr.util.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useXoVmTemplateCollection } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useNewVmPoolResources(pool: MaybeRefOrGetter<FrontXoPool | undefined>) {
  const { networks } = useXoNetworkCollection()
  const { getPifsByNetworkId } = useXoPifCollection()
  const { srs, vdiIsosBySrName } = useXoSrCollection()
  const { hostsByPool } = useXoHostCollection()
  const { vmsTemplatesByPool } = useXoVmTemplateCollection()

  const poolId = computed(() => toValue(pool)?.id)

  const hosts = computed(() => (poolId.value === undefined ? [] : (hostsByPool.value.get(poolId.value) ?? [])))

  const templates = computed(() =>
    poolId.value === undefined ? [] : (vmsTemplatesByPool.value.get(poolId.value) ?? [])
  )

  const poolNetworks = computed(() => networks.value.filter(network => network.$pool === poolId.value))

  const poolSrs = computed(() => srs.value.filter(sr => isWritableSrOfPool(sr, poolId.value)))

  const isoSrNameByVdiId = computed(() => {
    const srNames = new Map<FrontXoVdi['id'], string>()

    for (const [srName, srVdis] of Object.entries(vdiIsosBySrName.value)) {
      srVdis.filter(vdi => vdi.$pool === poolId.value).forEach(vdi => srNames.set(vdi.id, srName))
    }

    return srNames
  })

  const isoVdis = computed(() =>
    Object.values(vdiIsosBySrName.value)
      .flat()
      .filter(vdi => isoSrNameByVdiId.value.has(vdi.id))
  )

  const getIsoLabel = (vdi: FrontXoVdi) => `[${isoSrNameByVdiId.value.get(vdi.id) ?? ''}] ${vdi.name_label}`

  const defaultNetwork = computed(() => {
    if (poolId.value === undefined) {
      return undefined
    }

    return (
      poolNetworks.value.find(network => network.other_config.automatic === 'true') ??
      poolNetworks.value.find(network => {
        const pifs = getPifsByNetworkId(network.id)

        return pifs.length > 0 && pifs.every(pif => pif.management)
      })
    )
  })

  return {
    hosts,
    templates,
    poolNetworks,
    poolSrs,
    isoVdis,
    getIsoLabel,
    defaultNetwork,
  }
}
