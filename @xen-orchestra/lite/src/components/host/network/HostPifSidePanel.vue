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
      <!-- PIF -->
      <UiCard class="card">
        <UiCardTitle>{{ isBond ? $t('bond') : $t('pif') }}</UiCardTitle>
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
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(pif.uuid)"
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
                <span v-tooltip class="text-ellipsis">{{ networkNameLabel }}</span>
              </div>
            </template>
            <template v-if="networkNameLabel" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(networkNameLabel)"
              />
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
            <template v-if="pif.device" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(pif.device)"
              />
            </template>
          </VtsCardRowKeyValue>
          <!-- PIF STATUS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ isBond ? $t('bond-status') : $t('pif-status') }}
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
            <template v-if="getVlan !== '-'" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(String(getVlan))"
              />
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
      <UiCard class="card">
        <UiCardTitle>{{ $t('network-information') }}</UiCardTitle>
        <div class="content">
          <!-- IP ADDRESSES -->
          <VtsCardRowKeyValue class="ip-addresses-container">
            <template #key>
              <div class="ip-addresses-title">{{ $t('ip-addresses') }}</div>
            </template>
            <template v-if="addressesIp.length > 0" #value>
              <div v-for="(ip, index) in addressesIp" :key="ip" class="ip-addresses">
                <span class="text-ellipsis">{{ ip }}</span>
                <div>
                  <UiButtonIcon
                    v-if="ip !== '-'"
                    v-tooltip="copied && $t('core.copied')"
                    :icon="faCopy"
                    size="medium"
                    accent="brand"
                    @click="copy(ip)"
                  />
                  <UiButtonIcon
                    v-if="index === 0 && addressesIp.length > 1"
                    :icon="faEllipsis"
                    size="medium"
                    accent="brand"
                  />
                </div>
              </div>
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
            <template v-if="pif.MAC" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(pif.MAC)"
              />
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
            <template v-if="getNetmask !== '-'" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(String(getNetmask))"
              />
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
            <template v-if="getDNS !== '-'" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(String(getDNS))"
              />
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
            <template v-if="getGateway !== '-'" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(String(getGateway))"
              />
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
          <!-- BOND DEVICES -->
          <VtsCardRowKeyValue v-if="bondDevices.length > 0" class="bond-devices-container">
            <template #key>
              <div class="bond-devices-title">{{ $t('bond-devices') }}</div>
            </template>
            <template #value>
              <div v-for="(device, index) in bondDevices" :key="device" class="bond-devices">
                <span class="text-ellipsis">{{ device }}</span>
                <div>
                  <UiButtonIcon
                    v-if="device"
                    v-tooltip="copied && $t('core.copied')"
                    :icon="faCopy"
                    size="medium"
                    accent="brand"
                    @click="copy(device)"
                  />
                  <UiButtonIcon
                    v-if="index === 0 && bondDevices.length > 1"
                    :icon="faEllipsis"
                    size="medium"
                    accent="brand"
                  />
                </div>
              </div>
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
      <!-- PROPERTIES -->
      <UiCard class="card">
        <UiCardTitle>{{ $t('properties') }}</UiCardTitle>
        <div class="content">
          <!-- MTU -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('mtu') }}
            </template>
            <template #value>
              {{ getMtu }}
            </template>
            <template v-if="getMtu !== '-'" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(String(getMtu))"
              />
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
            <template v-if="networkPurpose" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                :icon="faCopy"
                size="medium"
                accent="brand"
                @click="copy(networkPurpose)"
              />
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
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCircle, faCopy, faEdit, faEllipsis, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import humanFormat from 'human-format'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: XenApiPif
}>()

const { getByOpaqueRef: getPifMetricsByOpaqueRef, getPifCarrier } = usePifMetricsStore().subscribe()
const { getBondsDevices, isBondMaster } = usePifStore().subscribe()
const { getByOpaqueRef: getOpaqueRefNetwork } = useNetworkStore().subscribe()

const { t } = useI18n()

const addressesIp = computed(() => {
  if (!pif) return ['-']
  const ips = [pif.IP, ...pif.IPv6].filter(ip => ip)
  return ips.length > 0 ? ips : ['-']
})

const network = computed(() => (pif ? getOpaqueRefNetwork(pif.network) : undefined))

const networkNameLabel = computed(() => network.value?.name_label || '-')

const networkPurpose = computed(() => (network.value?.purpose?.[0] ? t('on') : t('off')))

const networkTags = computed(() => (network.value?.tags.length ? network.value.tags : '-'))

const pifStatus = computed(() => (pif.currently_attached ? 'connected' : 'disconnected'))

const physicalInterfaceStatus = computed(() => (pif && getPifCarrier(pif) ? 'connected' : 'physically-disconnected'))

const getSpeed = computed(() => (pif ? getPifMetricsByOpaqueRef(pif.metrics)?.speed || 0 : 0))

const getVlan = computed(() => (pif.VLAN === -1 ? '-' : pif?.VLAN))

const getNetmask = computed(() => (pif.netmask === '' ? '-' : pif.netmask))

const getDNS = computed(() => (pif.DNS === '' ? '-' : pif.DNS))

const getGateway = computed(() => (pif.gateway === '' ? '-' : pif.gateway))

const getIpConfigurationMode = computed(() => {
  const ipMode = pif.ip_configuration_mode

  if (ipMode === 'Static') return t('static')
  if (ipMode === 'DHCP') return t('dhcp')
  return t('none')
})

const getMtu = computed(() => (pif.MTU === -1 ? '-' : pif.MTU))

const bondDevices = computed(() => getBondsDevices(pif))

const isBond = computed(() => isBondMaster(pif))

const byteFormatter = computed(() => (value: number) => {
  const speedInBytes = value * 1000000

  return humanFormat(speedInBytes, {
    scale: 'SI',
    unit: 'b/s',
    maxDecimals: 2,
  })
})

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

  .ip-addresses-container,
  .bond-devices-container {
    display: flex;
    align-items: start;

    .ip-addresses-title,
    .bond-devices-title {
      margin-top: 0.4rem;
    }
  }

  .ip-addresses,
  .bond-devices {
    display: flex;
    align-items: center;
    margin-bottom: 0.4rem;
    justify-content: space-between;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .tags {
    width: 100%;
    display: flex;
    gap: 0.8rem;
  }
}
</style>
