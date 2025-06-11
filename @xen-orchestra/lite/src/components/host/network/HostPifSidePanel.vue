<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'buttons-action': uiStore.isMobile }">
        <UiButtonIcon
          v-if="uiStore.isMobile"
          v-tooltip="t('close')"
          size="medium"
          variant="tertiary"
          accent="brand"
          :icon="faArrowLeft"
          @click="emit('close')"
        />
        <div>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            size="medium"
            variant="tertiary"
            accent="brand"
            :left-icon="faEdit"
          >
            {{ t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            size="medium"
            variant="tertiary"
            accent="danger"
            :left-icon="faTrash"
          >
            {{ t('delete') }}
          </UiButton>
        </div>
      </div>
    </template>
    <template #default>
      <!-- PIF -->
      <UiCard class="card">
        <UiCardTitle>{{ isBond ? t('bond') : t('pif') }}</UiCardTitle>
        <div class="content">
          <!-- UUID -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('uuid') }}
            </template>
            <template #value>
              {{ pif.uuid }}
            </template>
            <template #addons>
              <VtsIcon
                v-if="pif.management"
                v-tooltip="t('management')"
                accent="info"
                :icon="faCircle"
                :overlay-icon="faStar"
              />
              <VtsCopyButton :value="pif.uuid" />
            </template>
          </VtsCardRowKeyValue>
          <!-- NETWORK -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('network') }}
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
                <span v-tooltip class="value text-ellipsis">{{ network?.name_label }}</span>
              </div>
            </template>
            <template v-if="network?.name_label" #addons>
              <VtsCopyButton :value="network.name_label" />
            </template>
          </VtsCardRowKeyValue>
          <!-- DEVICE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('device') }}
            </template>
            <template #value>
              {{ pif.device }}
            </template>
            <template #addons>
              <VtsCopyButton :value="pif.device" />
            </template>
          </VtsCardRowKeyValue>
          <!-- PIF STATUS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ isBond ? t('bond-status') : t('pif-status') }}
            </template>
            <template #value>
              <VtsConnectionStatus :status />
            </template>
          </VtsCardRowKeyValue>
          <!-- PHYSICAL INTERFACE STATUS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('physical-interface-status') }}
            </template>
            <template #value>
              <VtsConnectionStatus :status="physicalInterfaceStatus" />
            </template>
          </VtsCardRowKeyValue>
          <!-- VLAN -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('vlan') }}
            </template>
            <template #value>
              {{ pif.VLAN === -1 ? t('none') : pif.VLAN }}
            </template>
            <template v-if="pif.VLAN !== -1" #addons>
              <VtsCopyButton :value="String(pif.VLAN)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- TAGS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('tags') }}
            </template>
            <template #value>
              <UiTagsList class="tags value">
                <UiTag v-for="tag in network?.tags" :key="tag" accent="info" variant="secondary">
                  {{ tag }}
                </UiTag>
              </UiTagsList>
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
      <!-- NETWORK INFORMATION -->
      <UiCard class="card">
        <UiCardTitle>{{ t('network-information') }}</UiCardTitle>
        <div class="content">
          <!-- IP ADDRESSES -->
          <div v-if="ipAddresses.length">
            <VtsCardRowKeyValue v-for="(ip, index) in ipAddresses" :key="ip">
              <template #key>
                <div v-if="index === 0">{{ t('ip-addresses') }}</div>
              </template>
              <template #value>
                <span v-tooltip class="text-ellipsis">{{ ip }}</span>
              </template>
              <template #addons>
                <VtsCopyButton :value="ip" />
                <UiButtonIcon
                  v-if="index === 0 && ipAddresses.length > 1"
                  v-tooltip="t('coming-soon')"
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
              {{ t('ip-addresses') }}
            </template>
            <template #value>
              <span class="value" />
            </template>
          </VtsCardRowKeyValue>
          <!-- MAC ADDRESSES -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('mac-address') }}
            </template>
            <template #value>
              {{ pif.MAC }}
            </template>
            <template #addons>
              <VtsCopyButton :value="pif.MAC" />
            </template>
          </VtsCardRowKeyValue>
          <!-- NETMASK -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('netmask') }}
            </template>
            <template #value>
              <span class="value">{{ pif.netmask }}</span>
            </template>
            <template v-if="pif.netmask" #addons>
              <VtsCopyButton :value="String(pif.netmask)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- DNS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('dns') }}
            </template>
            <template #value>
              <span class="value">
                {{ pif.DNS }}
              </span>
            </template>
            <template v-if="pif.DNS" #addons>
              <VtsCopyButton :value="String(pif.DNS)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- GATEWAY -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('gateway') }}
            </template>
            <template #value>
              <span class="value">
                {{ pif.gateway }}
              </span>
            </template>
            <template v-if="pif.gateway" #addons>
              <VtsCopyButton :value="String(pif.gateway)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- IP CONFIGURATION MODE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('ip-mode') }}
            </template>
            <template #value>
              {{ ipConfigurationMode }}
            </template>
          </VtsCardRowKeyValue>
          <!-- BOND DEVICES -->
          <div>
            <VtsCardRowKeyValue v-for="(device, index) in bondDevices" :key="device">
              <template #key>
                <div v-if="index === 0">{{ t('bond-devices') }}</div>
              </template>
              <template #value>
                <span v-tooltip class="text-ellipsis">{{ device }}</span>
              </template>
              <template v-if="device" #addons>
                <VtsCopyButton :value="device" />
                <UiButtonIcon
                  v-if="index === 0 && bondDevices.length > 1"
                  v-tooltip="t('coming-soon')"
                  disabled
                  :icon="faEllipsis"
                  size="medium"
                  accent="brand"
                />
              </template>
            </VtsCardRowKeyValue>
          </div>
        </div>
      </UiCard>
      <!-- PROPERTIES -->
      <UiCard class="card">
        <UiCardTitle>{{ t('properties') }}</UiCardTitle>
        <div class="content">
          <!-- MTU -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('mtu') }}
            </template>
            <template #value>
              {{ pif.MTU === -1 ? t('none') : pif.MTU }}
            </template>
            <template v-if="pif.MTU !== -1" #addons>
              <VtsCopyButton :value="String(pif.MTU)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- SPEED -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('speed') }}
            </template>
            <template #value>
              {{ speed }}
            </template>
          </VtsCardRowKeyValue>
          <!-- NETWORK BLOCK DEVICE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('network-block-device') }}
            </template>
            <template #value>
              {{ networkPurpose }}
            </template>
            <template #addons>
              <VtsCopyButton :value="networkPurpose" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XenApiPif } from '@/libs/xen-api/xen-api.types'
import { useNetworkStore } from '@/stores/xen-api/network.store'
import { usePifMetricsStore } from '@/stores/xen-api/pif-metrics.store'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store.ts'
import { faArrowLeft, faCircle, faEdit, faEllipsis, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import humanFormat from 'human-format'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: XenApiPif
}>()

const emit = defineEmits<{
  close: []
}>()

const { getByOpaqueRef: getPifMetricsByOpaqueRef, getPifCarrier } = usePifMetricsStore().subscribe()
const { getByOpaqueRef: getNetworkByOpaqueRef } = useNetworkStore().subscribe()
const { getBondsDevices, isBondMaster } = usePifStore().subscribe()
const uiStore = useUiStore()

const { t } = useI18n()

const ipAddresses = computed(() => [pif.IP, ...pif.IPv6].filter(ip => ip))

const network = computed(() => getNetworkByOpaqueRef(pif.network))

const networkPurpose = computed(() => (network.value?.purpose?.[0] ? t('on') : t('off')))

const status = computed(() => (pif.currently_attached ? 'connected' : 'disconnected'))

const physicalInterfaceStatus = computed(() => (getPifCarrier(pif) ? 'connected' : 'physically-disconnected'))

const ipConfigurationMode = computed(() => {
  switch (pif.ip_configuration_mode) {
    case 'Static':
      return t('static')
    case 'DHCP':
      return t('dhcp')
    default:
      return t('none')
  }
})

const bondDevices = computed(() => getBondsDevices(pif))

const isBond = computed(() => isBondMaster(pif))

const speed = computed(() => {
  const speed = getPifMetricsByOpaqueRef(pif.metrics)?.speed || 0
  const speedInBytes = speed * 1000000

  return humanFormat(speedInBytes, {
    scale: 'SI',
    unit: 'b/s',
    maxDecimals: 2,
  })
})
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

  .tags {
    width: 100%;
    display: flex;
    gap: 0.8rem;
  }

  .value:empty::before {
    content: '-';
  }
}

.mobile-drawer {
  position: fixed;
  inset: 0;

  .buttons-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
