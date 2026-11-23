import {
  type FrontXoNetwork,
  useXoNetworkCollection,
} from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { getNetworkStatus, getPoolNetworkRoute, isPrivateNetwork } from '@/modules/network/utils/xo-network.util.ts'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useCenteredWindow } from '@/shared/composables/centered-window.composable.ts'
import type { IconName } from '@core/icons'
import { compareStrings } from '@core/utils/compare-strings.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY } from '@vates/types'
import { computed, type MaybeRefOrGetter, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RouteLocationAsRelative } from 'vue-router'

const VISIBLE_POOL_GROUPS_COUNT = 5

function getPoolName(pool: FrontXoPool | undefined) {
  if (pool === undefined) {
    return ''
  }

  return pool.name_label
}

export function useXoNetworkPoolGroups(rawNetwork: MaybeRefOrGetter<FrontXoNetwork>) {
  const network = toComputed(rawNetwork)

  const { t } = useI18n()

  const { privateNetworksByUuid } = useXoNetworkCollection()
  const { getPoolById } = useXoPoolCollection()
  const { getPifsByNetworkId } = useXoPifCollection()

  const isPrivate = computed(() => isPrivateNetwork(network.value))

  const groupNetworks = computed(() => {
    if (!isPrivate.value) {
      return [network.value]
    }

    const privateNetworkUuid = network.value.other_config[SDN_CONTROLLER_PRIVATE_NETWORK_UUID_KEY]

    const sameUuidNetworks = privateNetworksByUuid.value.get(privateNetworkUuid)

    if (sameUuidNetworks === undefined) {
      return [network.value]
    }

    const knownPoolNetworks = sameUuidNetworks.filter(
      sameUuidNetwork => getPoolById(sameUuidNetwork.$pool) !== undefined
    )

    if (knownPoolNetworks.length < 2) {
      return [network.value]
    }

    return knownPoolNetworks
  })

  const isCrossPool = computed(() => groupNetworks.value.length > 1)

  const poolGroups = computed(() => {
    const groups = groupNetworks.value.map(groupNetwork => ({
      network: groupNetwork,
      pool: getPoolById(groupNetwork.$pool),
      pifs: getPifsByNetworkId(groupNetwork.id),
    }))

    return groups.sort((group1, group2) => compareStrings(getPoolName(group1.pool), getPoolName(group2.pool)))
  })

  const pifsCount = computed(() => poolGroups.value.reduce((count, group) => count + group.pifs.length, 0))

  const currentPoolGroupIndex = computed(() =>
    poolGroups.value.findIndex(group => group.network.id === network.value.id)
  )

  const {
    isExpanded: areAllPoolGroupsVisible,
    hasHiddenItems: hasHiddenPoolGroups,
    visibleItems: visiblePoolGroups,
  } = useCenteredWindow(poolGroups, currentPoolGroupIndex, VISIBLE_POOL_GROUPS_COUNT)

  const expandedNetworkIds = ref(new Set<FrontXoNetwork['id']>())

  watch(
    () => network.value.id,
    networkId => {
      expandedNetworkIds.value = new Set([networkId])
      areAllPoolGroupsVisible.value = false
    },
    { immediate: true }
  )

  function toggleNetwork(networkId: FrontXoNetwork['id']) {
    if (expandedNetworkIds.value.has(networkId)) {
      expandedNetworkIds.value.delete(networkId)
    } else {
      expandedNetworkIds.value.add(networkId)
    }
  }

  function toggleAllPoolGroups() {
    areAllPoolGroupsVisible.value = !areAllPoolGroupsVisible.value
  }

  const visiblePoolGroupItems = computed(() =>
    visiblePoolGroups.value.map(group => {
      const isExpanded = expandedNetworkIds.value.has(group.network.id)

      let toggleIcon: IconName = 'fa:angle-right'

      if (isExpanded) {
        toggleIcon = 'fa:angle-down'
      }

      let poolRoute: RouteLocationAsRelative | undefined

      if (group.pool !== undefined) {
        poolRoute = getPoolNetworkRoute(group.pool.id, group.network.id)
      }

      return {
        ...group,
        isCurrent: group.network.id === network.value.id,
        toggleIcon,
        poolRoute,
        status: getNetworkStatus(group.pifs),
        isTableVisible: !isCrossPool.value || isExpanded,
      }
    })
  )

  const allPoolGroupsToggleLabel = computed(() => {
    if (areAllPoolGroupsVisible.value) {
      return t('action:see-less')
    }

    return t('action:see-all')
  })

  return {
    isCrossPool,
    poolGroups,
    pifsCount,
    visiblePoolGroupItems,
    hasHiddenPoolGroups,
    allPoolGroupsToggleLabel,
    toggleNetwork,
    toggleAllPoolGroups,
  }
}
