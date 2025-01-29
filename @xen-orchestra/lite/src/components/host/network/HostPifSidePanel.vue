<template>
  <UiPanel class="pif-panel">
    <VtsNoSelectionHero v-if="!pif" type="panel" />
    <template #header>
      <UiButton size="medium" variant="tertiary" accent="info" :left-icon="faEdit">
        {{ $t('edit') }}
      </UiButton>
      <UiButton size="medium" variant="tertiary" accent="danger" :left-icon="faTrash">
        {{ $t('delete') }}
      </UiButton>
    </template>
    <!-- PIF -->
    <UiCard v-if="pif" class="card">
      <UiCardTitle>{{ $t('pif') }}</UiCardTitle>
      <div class="content">
        <!-- UUID -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('uuid') }}
          </template>
          <template #value>
            {{ pif.uuid }}
          </template>
          <template #addons>
            <VtsIcon
              v-if="pif.management"
              v-tooltip="t('management')"
              accent="warning"
              :icon="faCircle"
              :overlay-icon="faStar"
            />
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
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
              <span v-tooltip class="text-ellipsis">{{ networkNameLabel }}</span>
            </div>
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <!-- DEVICE -->
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
        <!-- PIF STATUS -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('pif-status') }}
          </template>
          <template #value>
            <VtsConnectionStatus :status="pifStatus" />
          </template>
        </VtsCardRowKeyValue>
        <!-- PHYSICAL INTERFACE STATUS -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('physical-interface-status') }}
          </template>
          <template #value>
            <VtsConnectionStatus :status="physicalInterfaceStatus" />
          </template>
        </VtsCardRowKeyValue>
        <!-- VLAN -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('vlan') }}
          </template>
          <template #value>
            {{ getVlan }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <!-- TAGS -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('tags') }}
          </template>
          <template #value>
            <div v-if="networkTags">{{ networkTags }}</div>
            <div v-else class="tags">
              <UiTag v-for="tag in networkTags" :key="tag" accent="info" variant="secondary">
                {{ tag }}
              </UiTag>
            </div>
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <!-- NETWORK INFORMATION -->
    <UiCard v-if="pif" class="card">
      <UiCardTitle>{{ $t('network-information') }}</UiCardTitle>
      <div class="content">
        <!-- IP ADDRESSES -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('ip-addresses') }}
          </template>
          <template v-if="allIps.length > 0" #value>
            <span v-for="ip in allIps" :key="ip" v-tooltip class="text-ellipsis">{{ ip }}</span>
          </template>
          <template #addons>
            <UiButtonIcon v-if="allIps.length > 1" :icon="faEllipsis" size="medium" accent="info" />
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <!-- MAC ADDRESSES -->
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
        <!-- NETMASK -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('netmask') }}
          </template>
          <template #value>
            {{ getNetmask }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <!-- DNS -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('dns') }}
          </template>
          <template #value>
            {{ getDNS }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <!-- GATEWAY -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('gateway') }}
          </template>
          <template #value>
            {{ getGateway }}
          </template>
          <template #addons>
            <UiButtonIcon :icon="faCopy" size="medium" accent="info" />
          </template>
        </VtsCardRowKeyValue>
        <!-- IP CONFIGURATION MODE -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('ip-mode') }}
          </template>
          <template #value>
            {{ getIpConfigurationMode }}
          </template>
        </VtsCardRowKeyValue>
      </div>
    </UiCard>
    <!-- PROPERTIES -->
    <UiCard v-if="pif" class="card">
      <UiCardTitle>{{ $t('properties') }}</UiCardTitle>
      <div class="content">
        <!-- MTU -->
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
        <!-- SPEED -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('speed') }}
          </template>
          <template #value>
            {{ byteFormatter(getSpeed) }}
          </template>
        </VtsCardRowKeyValue>
        <!-- NETWORK BLOCK DEVICE -->
        <VtsCardRowKeyValue>
          <template #key>
            {{ $t('network-block-device') }}
          </template>
          <template #value>
            {{ networkPurpose }}
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
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faCopy, faEdit, faEllipsis, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import humanFormat from 'human-format'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const { records } = usePifStore().subscribe()
const { getByOpaqueRef: getHostOpaqueRef } = useHostStore().subscribe()
const { getByOpaqueRef: getOpaqueRefNetwork } = useNetworkStore().subscribe()
const { getByOpaqueRef: getOpaqueRefMetrics, getPifCarrier } = usePifMetricsStore().subscribe()

const { t } = useI18n()
const pifId = useRouteQuery('id')
const route = useRoute()

const hostId = route.params.uuid as XenApiHost['uuid']

const pifs = computed(() => {
  return records.value.filter(pif => {
    const host = getHostOpaqueRef(pif.host)

    return host?.uuid === hostId
  })
})

const pif = computed(() => pifs.value.find(pif => pif.uuid === pifId.value))

const network = computed(() => (pif.value ? getOpaqueRefNetwork(pif.value.network) : undefined))

const allIps = computed(() => {
  if (!pif.value) return ['-']
  const ips = [pif.value.IP, ...pif.value.IPv6].filter(ip => ip)
  return ips.length > 0 ? ips : ['-']
})

const networkNameLabel = computed(() => network.value?.name_label || '-')

const networkPurpose = computed(() => (network.value?.purpose?.[0] ? t('on') : t('off')))

const networkTags = computed(() => (network.value?.tags?.length ? network.value.tags : '-'))

const pifStatus = computed(() => (pif.value?.currently_attached ? 'connected' : 'disconnected'))

const physicalInterfaceStatus = computed(() => {
  return pif.value && getPifCarrier(pif.value) ? 'connected' : 'physically-disconnected'
})

const getSpeed = computed(() => (pif.value ? getOpaqueRefMetrics(pif.value.metrics)?.speed || 0 : 0))

const getVlan = computed(() => (pif.value?.VLAN === -1 ? '-' : pif.value?.VLAN))

const getNetmask = computed(() => (pif.value?.netmask === '' ? '-' : pif.value?.netmask))

const getDNS = computed(() => (pif.value?.DNS === '' ? '-' : pif.value?.DNS))

const getGateway = computed(() => (pif.value?.gateway === '' ? '-' : pif.value?.gateway))

const getIpConfigurationMode = computed(() =>
  pif.value?.ip_configuration_mode === t('none') ? '-' : pif.value?.ip_configuration_mode
)

const byteFormatter = computed(() => (value: number) => {
  const speedInBytes = value * 1000000

  return humanFormat(speedInBytes, {
    scale: 'SI',
    unit: 'b/s',
    maxDecimals: 2,
  })
})
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
