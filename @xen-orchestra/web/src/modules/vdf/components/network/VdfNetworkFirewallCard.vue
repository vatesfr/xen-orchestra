<template>
  <UiPanelCard v-if="pool !== undefined && hasFirewall" class="vdf-network-firewall-card">
    <UiPanelCardTitle size="medium" :label="t('firewall')" icon="fa:shield" />
    <div class="content typo-body-regular-small">
      <span v-if="isUnprotected" class="secondary">{{ t('firewall:network:unprotected:info') }}</span>
      <span v-else>{{ t('firewall:network:protected-interfaces', { n: protectedCount }, protectedCount) }}</span>
      <div v-if="groupNames.length > 0" class="groups">
        <span class="secondary">{{ t('firewall:network:groups') }}</span>
        <VdfGroupChip v-for="name of groupNames" :key="name" :scope-id="pool.id" :group="name" />
      </div>
      <!-- vdf#98: tagging this network protects every VM on it; vdf:unprotected wins -->
      <UiInfo v-if="networkPolicies.length > 0" :accent="isUnprotected ? 'warning' : 'info'" wrap>
        {{
          t(isUnprotected ? 'firewall:network:network-policy:unprotected' : 'firewall:network:network-policy', {
            policies: networkPolicies.join(', '),
          })
        }}
      </UiInfo>
      <UiToggle
        :model-value="isUnprotected"
        :disabled="isRunning"
        @update:model-value="setUnprotected($event === true)"
      >
        {{ t('firewall:network:leave-out') }}
      </UiToggle>
      <UiInfo v-if="error" accent="danger" wrap>{{ error }}</UiInfo>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfGroupChip from '@/modules/vdf/components/VdfGroupChip.vue'
import { provideVdfGroups } from '@/modules/vdf/composables/vdf-groups-context.composable.ts'
import { useVdfInterfaces, useVdfNetworkTags } from '@/modules/vdf/composables/vdf-interfaces.composable.ts'
import { useVdfPublishedPolicy } from '@/modules/vdf/remote-resources/use-vdf-published-policy.ts'
import { displayName } from '@/modules/vdf/utils/vdf-global.util.ts'
import { enforcedPolicies } from '@/modules/vdf/utils/vdf-monitor.util.ts'
import {
  groupNetworks,
  isNetworksOnly,
  isOnNetworks,
  VDF_UNPROTECTED_TAG,
} from '@/modules/vdf/utils/vdf-networks.util.ts'
import { useXoVifCollection } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiToggle from '@core/components/ui/toggle/UiToggle.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// A network as the firewall sees it (vdf#36): how many protected
// interfaces it carries, the groups scoped to it, and whether it's left
// out (vdf:unprotected: storage, backup or transit networks)
const { network } = defineProps<{
  network: FrontXoNetwork
}>()

const { t } = useI18n()

const { pools } = useXoPoolCollection()

const pool = computed(() => pools.value.find(candidate => candidate.id === network.$pool))

// only in a pool where VDF has published something
const hasFirewall = computed(() => Object.keys(pool.value?.otherConfig ?? {}).some(key => key.startsWith('vdf:policy')))

const { publishedPolicy } = useVdfPublishedPolicy({}, () => network.$pool)

const groups = computed(() => publishedPolicy.value?.document?.groups ?? {})

const policies = computed(() => {
  const document = publishedPolicy.value?.document

  return document === undefined || document === null ? [] : enforcedPolicies(document)
})

provideVdfGroups(groups)

const isUnprotected = computed(() => network.tags.includes(VDF_UNPROTECTED_TAG))

// network policies (vdf#98): applied to a group on networks alone this
// network is part of, every interface on it, current and future
const networkPolicies = computed(() => {
  const document = publishedPolicy.value?.document

  return (document?.policies ?? [])
    .filter(policy => {
      const group = groups.value[policy.appliedTo]

      return isNetworksOnly(group) && isOnNetworks(network.tags, groupNetworks(group))
    })
    .map(policy => displayName(policy.name))
})

// the groups scoped to networks this one is part of
const groupNames = computed(() =>
  Object.entries(groups.value)
    .filter(([, group]) => groupNetworks(group).length > 0 && isOnNetworks(network.tags, groupNetworks(group)))
    .map(([name]) => name)
    .sort()
)

const { vms } = useXoVmCollection()

const { vifs } = useXoVifCollection()

const { groupInterfaces } = useVdfInterfaces()

// the interfaces on this network an enforced policy applies to
const protectedCount = computed(
  () =>
    vifs.value.filter(vif => {
      const vm = vms.value.find(candidate => candidate.id === vif.$VM)

      return (
        vif.$network === network.id &&
        vm !== undefined &&
        policies.value.some(policy => {
          const group = groups.value[policy.appliedTo]

          return groupInterfaces(vm, group).some(iface => iface.vif.id === vif.id)
        })
      )
    }).length
)

const { setNetworkTag, isRunning } = useVdfNetworkTags()

const error = ref<string>()

const { open: openConfirm } = useOverlay({
  component: () => import('@/modules/vdf/components/VdfConfirmModal.vue'),
  events: { onConfirm: true, onCancel: true },
})

async function setUnprotected(shouldBeUnprotected: boolean) {
  if (shouldBeUnprotected && protectedCount.value > 0) {
    const response = await openConfirm({
      props: {
        accent: 'warning',
        icon: 'fa:shield',
        title: t('firewall:network:leave-out:title', { network: network.name_label }),
        message: t('firewall:network:leave-out:message', { n: protectedCount.value }, protectedCount.value),
        confirmLabel: t('firewall:network:leave-out'),
      },
    })

    if (response.event !== 'onConfirm') {
      return
    }
  }

  try {
    error.value = undefined
    await setNetworkTag([network], VDF_UNPROTECTED_TAG, shouldBeUnprotected)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : String(caught)
  }
}
</script>

<style lang="postcss" scoped>
.vdf-network-firewall-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }

  .groups {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.8rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
