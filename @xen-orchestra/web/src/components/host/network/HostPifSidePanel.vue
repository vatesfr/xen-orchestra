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
        <UiCardTitle>{{ pif.isBondMaster ? t('bond') : t('pif') }}</UiCardTitle>
        <div class="content">
          <!-- UUID -->
          <UiLabelValue :label="t('uuid')" :value="pif.id" wrap>
            <template #actions>
              <VtsIcon v-if="pif.management" v-tooltip="t('management')" name="legacy:primary" size="medium" />
              <VtsCopyButton :value="pif.id" />
            </template>
          </UiLabelValue>
          <!-- NETWORK -->
          <UiLabelValue :label="t('network')" :value="network?.name_label">
            <!--
 <template #value>
              TODO Remove the span when the link works and the icon is fixed

              <UiComplexIcon size="medium">
                <VtsIcon :icon="faNetworkWired" accent="current" />
                <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
              </UiComplexIcon>
              <a href="">{{ networkNameLabel }}</a>

              <span v-tooltip class="value text-ellipsis">{{ network?.name_label }}</span>
            </template>
-->
            <template v-if="network?.name_label" #actions>
              <VtsCopyButton :value="network.name_label" />
            </template>
          </UiLabelValue>
          <!-- DEVICE -->
          <UiLabelValue :label="t('device')" :value="pif.device">
            <template #actions>
              <VtsCopyButton :value="pif.device" />
            </template>
          </UiLabelValue>
          <!-- PIF STATUS -->
          <UiLabelValue :label="pif.isBondMaster ? t('bond-status') : t('pif-status')">
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
          <UiLabelValue :label="t('vlan')" :value="pif.vlan === -1 ? t('none') : String(pif.vlan)">
            <template v-if="pif.vlan !== -1" #actions>
              <VtsCopyButton :value="String(pif.vlan)" />
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
          <template v-if="ipAddresses.length">
            <UiLabelValue v-for="(ip, index) in ipAddresses" :key="ip" :label="t('ip-addresses')" :value="ip">
              <template #actions>
                <VtsCopyButton :value="ip" />
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
          </template>
          <UiLabelValue v-else :label="t('ip-addresses')" :value="ipAddresses" />
          <!-- MAC ADDRESSES -->
          <UiLabelValue :label="t('mac-address')" :value="pif.mac">
            <template #actions>
              <VtsCopyButton :value="pif.mac" />
            </template>
          </UiLabelValue>
          <!-- NETMASK -->
          <UiLabelValue :label="t('netmask')" :value="pif.netmask">
            <template v-if="pif.netmask" #actions>
              <VtsCopyButton :value="pif.netmask" />
            </template>
          </UiLabelValue>
          <!-- DNS -->
          <UiLabelValue :label="t('dns')" :value="pif.dns">
            <template v-if="pif.dns" #actions>
              <VtsCopyButton :value="pif.dns" />
            </template>
          </UiLabelValue>
          <!-- GATEWAY -->
          <UiLabelValue :label="t('gateway')" :value="pif.gateway">
            <template v-if="pif.gateway" #actions>
              <VtsCopyButton :value="pif.gateway" />
            </template>
          </UiLabelValue>
          <!-- IP CONFIGURATION MODE -->
          <UiLabelValue :label="t('ip-mode')" :value="ipConfigurationMode" />
          <!-- BOND DEVICES -->
          <div>
            <UiLabelValue
              v-for="(device, index) in bondDevices"
              :key="device"
              :label="t('bond-devices')"
              :value="device"
            >
              <template #actions>
                <VtsCopyButton :value="device" />
              </template>
              <template #addons>
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
          <UiLabelValue :label="t('mtu')" :value="pif.mtu === -1 ? t('none') : String(pif.mtu)">
            <template v-if="pif.mtu !== -1" #actions>
              <VtsCopyButton :value="String(pif.mtu)" />
            </template>
          </UiLabelValue>
          <!-- SPEED -->
          <UiLabelValue :label="t('speed')" :value="speed" />
          <!-- NETWORK BLOCK DEVICE -->
          <UiLabelValue :label="t('network-block-device')" :value="networkNbd">
            <template #actions>
              <VtsCopyButton :value="networkNbd" />
            </template>
          </UiLabelValue>
        </div>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import type { XoPif } from '@/types/xo/pif.type.ts'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import humanFormat from 'human-format'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: XoPif
}>()

const emit = defineEmits<{
  close: []
}>()

const { useGetNetworkById } = useXoNetworkCollection()
const { getBondsDevices } = useXoPifCollection()
const uiStore = useUiStore()

const { t } = useI18n()

const ipAddresses = computed(() => [pif.ip, ...pif.ipv6].filter(ip => ip))

const network = useGetNetworkById(() => pif.$network)

const networkNbd = computed(() => (network.value?.nbd ? t('on') : t('off')))

const status = computed(() => (pif.attached ? 'connected' : 'disconnected'))

const physicalInterfaceStatus = computed(() => (pif.carrier ? 'connected' : 'physically-disconnected'))

const ipConfigurationMode = computed(() => {
  switch (pif.mode) {
    case 'Static':
      return t('static')
    case 'DHCP':
      return t('dhcp')
    default:
      return t('none')
  }
})

const bondDevices = computed(() => getBondsDevices(pif))

const speed = computed(() => {
  const speed = pif.speed || 0
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
