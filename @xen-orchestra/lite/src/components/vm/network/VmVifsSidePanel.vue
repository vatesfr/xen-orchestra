<template>
  <UiPanel>
    <template #header>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        size="medium"
        variant="tertiary"
        accent="brand"
        :left-icon="faEdit"
      >
        {{ $t('edit') }}
      </UiButton>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        size="medium"
        variant="tertiary"
        accent="danger"
        :left-icon="faTrash"
      >
        {{ $t('delete') }}
      </UiButton>
    </template>
    <template #default>
      <!-- VIF -->
      <UiCard class="card">
        <UiCardTitle>{{ $t('vif') }}</UiCardTitle>
        <div class="content">
          <!-- UUID -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('uuid') }}
            </template>
            <template #value>
              {{ vif.uuid }}
            </template>
            <template #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(vif.uuid)"
              />
            </template>
          </VtsCardRowKeyValue>
          <!-- NETWORK -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('network') }}
            </template>
            <template #value>
              <div class="network">
                <!-- TODO Remove the span when the link works and the icon is fixed -->
                <!--
                <UiComplexIcon size="medium">
                  <VtsIcon :icon="faNetworkWired" accent="current" />
                  <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                </UiComplexIcon>
                <a href="">{{ networkNameLabel }}</a>
                -->
                <span v-tooltip class="text-ellipsis">{{ network?.name_label }}</span>
              </div>
            </template>
            <template v-if="network?.name_label" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(network?.name_label)"
              />
            </template>
          </VtsCardRowKeyValue>
          <!-- DEVICE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('device') }}
            </template>
            <template #value>
              {{ $t('vif-device', { device: vif.device }) }}
            </template>
            <template v-if="vif.device" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(vif.device)"
              />
            </template>
          </VtsCardRowKeyValue>
          <!-- VIF STATUS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('vif-status') }}
            </template>
            <template #value>
              <VtsConnectionStatus :status />
            </template>
          </VtsCardRowKeyValue>
          <!-- MTU -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('mtu') }}
            </template>
            <template #value>
              {{ vif.MTU }}
            </template>
            <template v-if="vif.MTU" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(String(vif.MTU))"
              />
            </template>
          </VtsCardRowKeyValue>
          <!-- LOCKING MODE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('locking-mode') }}
            </template>
            <template #value>
              {{ vif.locking_mode }}
            </template>
          </VtsCardRowKeyValue>
          <!-- TODO Need to add TX Checksumming -->
        </div>
      </UiCard>
      <!-- VIF NETWORK INFORMATION -->
      <UiCard class="card">
        <UiCardTitle>{{ $t('network-information') }}</UiCardTitle>
        <div class="content">
          <!-- IP ADDRESSES -->
          <div v-if="ipAddresses.length">
            <VtsCardRowKeyValue v-for="(ip, index) in ipAddresses" :key="ip">
              <template #key>
                <div v-if="index === 0">{{ $t('ip-addresses') }}</div>
              </template>
              <template #value>
                <span class="text-ellipsis">{{ ip }}</span>
              </template>
              <template #addons>
                <UiButtonIcon
                  v-if="ipAddresses.length"
                  v-tooltip="copied && $t('core.copied')"
                  :icon="faCopy"
                  size="medium"
                  accent="brand"
                  @click="copy(ip)"
                />
                <UiButtonIcon
                  v-if="index === 0 && ipAddresses.length > 1"
                  v-tooltip="$t('coming-soon')"
                  disabled
                  :icon="faEllipsis"
                  size="medium"
                  accent="brand"
                />
              </template>
            </VtsCardRowKeyValue>
          </div>
          <VtsCardRowKeyValue v-else>
            <template #key>
              {{ $t('ip-addresses') }}
            </template>
            <template #value>
              <span class="value" />
            </template>
          </VtsCardRowKeyValue>
          <!-- MAC ADDRESSES -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('mac-address') }}
            </template>
            <template #value>
              {{ vif.MAC }}
            </template>
            <template v-if="vif.MAC" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(vif.MAC)"
              />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XenApiVif } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { useVmGuestMetricsStore } from '@/stores/xen-api/vm-guest-metrics.store'
import { useVmStore } from '@/stores/xen-api/vm.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCopy, faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'

const { vif } = defineProps<{
  vif: XenApiVif
}>()

const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
const { getByOpaqueRef: getGuestMetricsByOpaqueRef } = useVmGuestMetricsStore().subscribe()
const { getByOpaqueRef: getVmByOpaqueRef } = useVmStore().subscribe()

const ipAddresses = computed(() => {
  const vm = getVmByOpaqueRef(vif.VM)

  if (vm) {
    const networks = getGuestMetricsByOpaqueRef(vm.guest_metrics)?.networks

    if (networks) {
      return [...new Set(Object.values(networks).sort())]
    }
  }
  return []
})

const network = computed(() => getNetworkByOpaqueRef(vif.network))

const status = computed(() => (vif.currently_attached ? 'connected' : 'disconnected'))

const { copy, copied } = useClipboard()
</script>

<style scoped lang="postcss">
.card {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .network {
    display: flex;
    gap: 0.8rem;
  }

  .value:empty::before {
    content: '-';
  }
}
</style>
