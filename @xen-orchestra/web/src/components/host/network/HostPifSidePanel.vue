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
        <UiCardTitle>{{ pif.isBondMaster ? t('bond') : t('pif') }}</UiCardTitle>
        <div class="content">
          <!-- UUID -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('uuid') }}
            </template>
            <template #value>
              {{ pif.id }}
            </template>
            <template #addons>
              <VtsIcon
                v-if="pif.management"
                v-tooltip="t('management')"
                accent="info"
                :icon="faCircle"
                :overlay-icon="faStar"
              />
              <VtsCopyButton :value="pif.id" />
            </template>
          </VtsCardRowKeyValue>
          <!-- NETWORK -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('network') }}
            </template>
            <template #value>
              <!-- TODO Remove the span when the link works and the icon is fixed -->
              <!--
              <UiComplexIcon size="medium">
                <VtsIcon :icon="faNetworkWired" accent="current" />
                <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
              </UiComplexIcon>
              <a href="">{{ networkNameLabel }}</a>
              -->
              <span v-tooltip class="value text-ellipsis">{{ network?.name_label }}</span>
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
              {{ pif.isBondMaster ? t('bond-status') : t('pif-status') }}
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
              {{ pif.vlan === -1 ? t('none') : pif.vlan }}
            </template>
            <template v-if="pif.vlan !== -1" #addons>
              <VtsCopyButton :value="String(pif.vlan)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- TAGS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('tags') }}
            </template>
            <template #value>
              <UiTagsList class="value">
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
          <template v-if="ipAddresses.length">
            <VtsCardRowKeyValue v-for="(ip, index) in ipAddresses" :key="ip">
              <template #key>
                <div v-if="index === 0">{{ t('ip-addresses') }}</div>
              </template>
              <template #value>
                <span class="text-ellipsis">{{ ip }}</span>
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
          </template>
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
              {{ pif.mac }}
            </template>
            <template #addons>
              <VtsCopyButton :value="pif.mac" />
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
              <VtsCopyButton :value="pif.netmask" />
            </template>
          </VtsCardRowKeyValue>
          <!-- DNS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('dns') }}
            </template>
            <template #value>
              <span class="value">
                {{ pif.dns }}
              </span>
            </template>
            <template v-if="pif.dns" #addons>
              <VtsCopyButton :value="pif.dns" />
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
              <VtsCopyButton :value="pif.gateway" />
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
              <template #addons>
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
              {{ pif.mtu === -1 ? t('none') : pif.mtu }}
            </template>
            <template v-if="pif.mtu !== -1" #addons>
              <VtsCopyButton :value="String(pif.mtu)" />
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
              {{ networkNbd }}
            </template>
            <template #addons>
              <VtsCopyButton :value="networkNbd" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store.ts'
import { usePifStore } from '@/stores/xo-rest-api/pif.store.ts'
import type { XoPif } from '@/types/xo/pif.type.ts'
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
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { faArrowLeft, faCircle, faEdit, faEllipsis, faStar, faTrash } from '@fortawesome/free-solid-svg-icons'
import humanFormat from 'human-format'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { pif } = defineProps<{
  pif: XoPif
}>()

const emit = defineEmits<{
  close: []
}>()

const { get: getNetwork } = useNetworkStore().subscribe()
const { getBondsDevices } = usePifStore().subscribe()
const uiStore = useUiStore()

const { t } = useI18n()

const ipAddresses = computed(() => [pif.ip, ...pif.ipv6].filter(ip => ip))

const network = computed(() => getNetwork(pif.$network))

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

  .buttons-action {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
}
</style>
