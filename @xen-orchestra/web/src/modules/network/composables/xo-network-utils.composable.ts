import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkType, NETWORK_TYPE } from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useMapper } from '@core/packages/mapper'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoNetworkUtils(rawNetwork: MaybeRefOrGetter<FrontXoNetwork | undefined>) {
  const { t } = useI18n()

  const network = toComputed(rawNetwork)

  const { getPifsByNetworkId } = useXoPifCollection()

  const pifs = computed(() => (network.value !== undefined ? getPifsByNetworkId(network.value.id) : []))

  const networkVlan = computed(() => {
    if (pifs.value.length === 0) {
      return
    }

    return pifs.value[0].vlan !== -1 ? pifs.value[0].vlan.toString() : t('none')
  })

  const networkNbd = computed(() => (network.value?.nbd ? t('on') : t('off')))

  const networkDefaultLockingMode = computed(() => (network.value?.defaultIsLocked ? t('disabled') : t('unlocked')))

  const networkType = computed(() => (network.value !== undefined ? getNetworkType(network.value) : undefined))

  const networkTypeLabel = useMapper(
    networkType,
    {
      [NETWORK_TYPE.BONDED]: t('bonded-network'),
      [NETWORK_TYPE.INTERNAL]: t('internal-network'),
      [NETWORK_TYPE.PHYSICAL]: t('physical-network'),
    },
    NETWORK_TYPE.PHYSICAL
  )

  const isInternalNetwork = computed(() => networkType.value === NETWORK_TYPE.INTERNAL)

  return {
    networkVlan,
    networkNbd,
    networkDefaultLockingMode,
    networkTypeLabel,
    isInternalNetwork,
  }
}
