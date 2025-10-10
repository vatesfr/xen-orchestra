<template>
  <UiPanel :class="{ 'mobile-drawer': uiStore.isMobile }">
    <template #header>
      <div :class="{ 'action-buttons-container': uiStore.isMobile }">
        <UiButtonIcon
          v-if="uiStore.isMobile"
          v-tooltip="t('close')"
          size="medium"
          variant="tertiary"
          accent="brand"
          icon="fa:angle-left"
          @click="emit('close')"
        />
        <div class="action-buttons">
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            size="medium"
            variant="tertiary"
            accent="brand"
            left-icon="fa:edit"
          >
            {{ t('edit') }}
          </UiButton>
          <UiButton
            v-tooltip="t('coming-soon')"
            disabled
            size="medium"
            variant="tertiary"
            accent="danger"
            left-icon="fa:trash"
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
          <UiLabelValue :label="t('uuid')" :value="pif.uuid" copyable>
            <template #addons>
              <VtsIcon v-if="pif.management" v-tooltip="t('management')" name="legacy:primary" size="medium" />
            </template>
          </UiLabelValue>
          <!-- NETWORK -->
          <UiLabelValue :label="t('network')" :value="network?.name_label" copyable>
            <!-- TODO Remove the span when the link works and the icon is fixed -->
            <!--
                <UiComplexIcon size="medium">
                  <VtsIcon icon="fa:network-wired" accent="current" />
                  <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
                </UiComplexIcon>
                <a href="">{{ networkNameLabel }}</a>
                -->
          </UiLabelValue>
          <!-- DEVICE -->
          <UiLabelValue :label="t('device')" :value="pif.device" copyable />
          <!-- PIF STATUS -->
          <UiLabelValue :label="isBond ? t('bond-status') : t('pif-status')">
            <template #value>
              <VtsConnectionStatus :status />
            </template>
          </UiLabelValue>
          <!-- PHYSICAL INTERFACE STATUS -->
          <UiLabelValue :label="t('physical-interface-status')">
            <template #value>
              <VtsConnectionStatus :status="physicalInterfaceStatus" />
            </template>
          </UiLabelValue>
          <!-- VLAN -->
          <UiLabelValue :label="t('vlan')" :value="pif.VLAN === -1 ? t('none') : String(pif.VLAN)">
            <template v-if="pif.VLAN !== -1" #actions>
              <VtsCopyButton :value="String(pif.VLAN)" />
            </template>
          </UiLabelValue>
          <!-- TAGS -->
          <UiLabelValue :label="t('tags')" :value="network?.tags" />
        </div>
      </UiCard>
      <!-- NETWORK INFORMATION -->
      <UiCard class="card">
        <UiCardTitle>{{ t('network-information') }}</UiCardTitle>
        <div class="content">
          <!-- IP ADDRESSES -->
          <div v-if="ipAddresses.length">
            <UiLabelValue v-for="(ip, index) in ipAddresses" :key="ip" :label="t('ip-addresses')" :value="ip" copyable>
              <template #addons>
                <UiButtonIcon
                  v-if="index === 0 && ipAddresses.length > 1"
                  v-tooltip="t('coming-soon')"
                  disabled
                  icon="fa:ellipsis"
                  size="medium"
                  accent="brand"
                />
              </template>
            </UiLabelValue>
          </div>
          <!-- MAC ADDRESSES -->
          <UiLabelValue :label="t('mac-address')" :value="pif.MAC" copyable />
          <!-- NETMASK -->
          <UiLabelValue :label="t('netmask')" :value="pif.netmask" copyable />
          <!-- DNS -->
          <UiLabelValue :label="t('dns')" :value="pif.DNS" copyable />
          <!-- GATEWAY -->
          <UiLabelValue :label="t('gateway')" :value="pif.gateway" copyable />
          <!-- IP CONFIGURATION MODE -->
          <UiLabelValue :label="t('ip-mode')" :value="ipConfigurationMode" />
          <!-- BOND DEVICES -->
          <div>
            <UiLabelValue
              v-for="(device, index) in bondDevices"
              :key="device"
              :label="t('bond-devices')"
              :value="device"
              copyable
            >
              <template v-if="device" #addons>
                <UiButtonIcon
                  v-if="index === 0 && bondDevices.length > 1"
                  v-tooltip="t('coming-soon')"
                  disabled
                  icon="fa:ellipsis"
                  size="medium"
                  accent="brand"
                />
              </template>
            </UiLabelValue>
          </div>
        </div>
      </UiCard>
      <!-- PROPERTIES -->
      <UiCard class="card">
        <UiCardTitle>{{ t('properties') }}</UiCardTitle>
        <div class="content">
          <!-- MTU -->
          <UiLabelValue :label="t('mtu')" :value="pif.MTU === -1 ? t('none') : String(pif.MTU)" copyable />
          <!-- SPEED -->
          <UiLabelValue :label="t('speed')" :value="speed" />
          <!-- NETWORK BLOCK DEVICE -->
          <UiLabelValue :label="t('network-block-device')" :value="networkPurpose" copyable />
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
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store.ts'
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
  background-color: lime;

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

  .action-buttons-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}

.action-buttons {
  display: flex;
  align-items: center;
}
</style>
