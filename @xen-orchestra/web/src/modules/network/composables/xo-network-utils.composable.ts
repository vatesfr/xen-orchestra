import { type FrontXoHost, useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import {
  ENCAPSULATION_LABELS,
  getNetworkEncapsulation,
  getNetworkType,
  isEncryptedNetwork,
  NETWORK_TYPE,
} from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { useMapper } from '@core/packages/mapper'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { SDN_CONTROLLER_PREFERRED_CENTER_KEY } from '@vates/types'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoNetworkUtils(rawNetwork: MaybeRefOrGetter<FrontXoNetwork | undefined>) {
  const { t } = useI18n()

  const network = toComputed(rawNetwork)

  const { getPifsByNetworkId } = useXoPifCollection()
  const { getHostById } = useXoHostCollection()

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
      [NETWORK_TYPE.PRIVATE]: t('private-network'),
    },
    NETWORK_TYPE.PHYSICAL
  )

  const isInternalNetwork = computed(() => networkType.value === NETWORK_TYPE.INTERNAL)

  const isPrivateNetwork = computed(() => networkType.value === NETWORK_TYPE.PRIVATE)

  const privateNetwork = computed(() => {
    if (!isPrivateNetwork.value) {
      return undefined
    }

    return network.value
  })

  const networkPreferredCenter = computed(() => {
    if (privateNetwork.value === undefined) {
      return undefined
    }

    const preferredCenterId = privateNetwork.value.other_config[SDN_CONTROLLER_PREFERRED_CENTER_KEY]

    if (preferredCenterId === undefined) {
      return undefined
    }

    return getHostById(preferredCenterId as FrontXoHost['id'])
  })

  const networkEncapsulationLabel = computed(() => {
    if (privateNetwork.value === undefined) {
      return undefined
    }

    return ENCAPSULATION_LABELS[getNetworkEncapsulation(privateNetwork.value)]
  })

  const isNetworkEncrypted = computed(() => {
    if (privateNetwork.value === undefined) {
      return false
    }

    return isEncryptedNetwork(privateNetwork.value)
  })

  return {
    networkVlan,
    networkNbd,
    networkDefaultLockingMode,
    networkTypeLabel,
    isInternalNetwork,
    isPrivateNetwork,
    networkPreferredCenter,
    networkEncapsulationLabel,
    isNetworkEncrypted,
  }
}
