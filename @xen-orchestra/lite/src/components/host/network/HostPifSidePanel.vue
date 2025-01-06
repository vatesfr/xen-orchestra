<template>
  <UiPanel class="pif-panel">
    <template #header>
      <UiButton size="medium" variant="tertiary" accent="info" :left-icon="faEdit">
        {{ $t('edit') }}
      </UiButton>
      <UiButton size="medium" variant="tertiary" accent="danger" :left-icon="faTrash">
        {{ $t('delete') }}
      </UiButton>
    </template>
    <UiCard class="card">
      <UiCardTitle>{{ $t('pif') }}</UiCardTitle>
      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('uuid') }}
          </template>
          <template #value>
            {{ pif.uuid }}
          </template>
          <template #addons>
            <VtsIcon accent="warning" :icon="faCircle" :overlay-icon="faStar" />
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('network') }}
          </template>
          <template #value>
            <div class="network">
              <UiComplexIcon size="medium">
                <VtsIcon :icon="faNetworkWired" accent="current" />
                <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
              </UiComplexIcon>
              <a href=""> {{ getNetworkData('name_label') }}</a>
            </div>
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('device') }}
          </template>
          <template #value>
            {{ pif.device }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('pif-status') }}
          </template>
          <template #value>
            <VtsConnectionStatus :status="getPifStatus(pif)" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('physical-interface-status') }}
          </template>
          <template #value>
            <VtsConnectionStatus :status="getPhysicalInterfaceStatus(pif)" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('vlan') }}
          </template>
          <template #value>
            {{ getPifData('VLAN') }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('tags') }}
          </template>
          <template #value>
            <div v-if="!Array.isArray(getNetworkData('tags'))">{{ getNetworkData('tags') }}</div>
            <div v-else class="tags">
              <UiTag v-for="tag in getNetworkData('tags')" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </div>
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <UiCard class="card">
      <UiCardTitle>{{ $t('network-information') }}</UiCardTitle>

      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('ip-addresses') }}
          </template>
          <template #value>
            <p v-for="ip in allIps" :key="ip" v-tooltip class="ip-address text-ellipsis">{{ getPifData('IP') }}</p>
            <p v-if="!allIps.length">{{ getPifData('IP') }}</p>
          </template>
          <template #addons>
            <UiButtonIcon v-if="allIps.length > 1" :icon="faEllipsis" size="medium" accent="info" />
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('mac-address') }}
          </template>
          <template #value>
            {{ pif.MAC }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('netmask') }}
          </template>
          <template #value>
            {{ getPifData('netmask') }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('dns') }}
          </template>
          <template #value>
            {{ getPifData('DNS') }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('gateway') }}
          </template>
          <template #value>
            {{ getPifData('gateway') }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('ip-mode') }}
          </template>
          <template #value>
            {{ getPifData('ip_configuration_mode') }}
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <UiCard class="card">
      <UiCardTitle>{{ $t('properties') }}</UiCardTitle>
      <div class="content">
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('mtu') }}
          </template>
          <template #value>
            {{ pif.MTU }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('speed') }}
          </template>
          <template #value>
            {{ byteFormatter(getSpeedData(pif.metrics)) }}
          </template>
        </VtsCardRowKeyValue>
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('network-block-device') }}
          </template>
          <template #value>
            {{ $t(`${getNetworkData('purpose')}`) }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XenApiNetwork, XenApiPif } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiComplexIcon from '@core/components/ui/complex-icon/UiComplexIcon.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import {
  faCheck,
  faCircle,
  faCopy,
  faEdit,
  faEllipsis,
  faNetworkWired,
  faStar,
  faTrash,
} from '@fortawesome/free-solid-svg-icons'
import humanFormat from 'human-format'
import { computed } from 'vue'

const { pif } = defineProps<{
  pif: XenApiPif
}>()

const { getByOpaqueRef: getOpaqueRefNetwork } = useNetworkStore().subscribe()
const { getByOpaqueRef: getOpaqueRefMetrics, getPifCarrier } = usePifMetricsStore().subscribe()

const allIps = computed(() => {
  return [pif.IP, ...pif.IPv6].filter(ip => ip)
})

const getNetworkData = (type: keyof XenApiNetwork) => {
  const network: XenApiNetwork = getOpaqueRefNetwork(pif.network)!

  switch (type) {
    case 'name_label':
      return network.name_label || '-'
    case 'purpose':
      return network.purpose[0] ? 'on' : 'off'
    case 'tags':
      return network.tags.length ? network.tags : '-'
  }
}

const getPifStatus = (pif: XenApiPif) => {
  const currentlyAttached = pif.currently_attached

  return currentlyAttached ? 'connected' : 'disconnected'
}

const getPhysicalInterfaceStatus = (pif: XenApiPif) => {
  const carrier = getPifCarrier(pif)

  return carrier ? 'connected' : 'disconnected-from-physical-device'
}

const getSpeedData = (speedRef: string) => {
  const metrics = getOpaqueRefMetrics(speedRef)
  return metrics?.speed ? metrics.speed : 0
}

const getPifData = (type: keyof XenApiPif) => {
  const value = pif[type]

  switch (type) {
    case 'VLAN':
      return value === -1 ? '-' : value
    case 'netmask':
    case 'DNS':
    case 'gateway':
    case 'IP':
      return value === '' ? '-' : pif.netmask
    case 'ip_configuration_mode':
      return value === 'None' ? '-' : value
  }
}

const byteFormatter = (value: number) => {
  const speedInBytes = value * 1000000

  return humanFormat(speedInBytes, {
    scale: 'SI',
    unit: 'b/s',
    maxDecimals: 2,
  })
}
</script>

<style scoped lang="postcss">
.pif-panel {
  width: 40rem;
  border-top: none;
}

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

  .tags {
    width: 100%;
    display: flex;
    gap: 0.8rem;
  }
}
</style>
