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
          :icon="faAngleLeft"
          @click="emit('close')"
        />
        <div class="action-buttons">
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
      <!-- VIF -->
      <UiCard class="card">
        <UiCardTitle>{{ t('vif') }}</UiCardTitle>
        <div class="content">
          <!-- UUID -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('uuid') }}
            </template>
            <template #value>
              {{ vif.id }}
            </template>
            <template #addons>
              <VtsCopyButton :value="vif.id" />
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
              <span v-tooltip class="text-ellipsis value">{{ network?.name_label }}</span>
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
              {{ t('vif-device', { device: vif.device }) }}
            </template>
            <template #addons>
              <VtsCopyButton :value="vif.device" />
            </template>
          </VtsCardRowKeyValue>
          <!-- VIF STATUS -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('vif-status') }}
            </template>
            <template #value>
              <VtsConnectionStatus :status />
            </template>
          </VtsCardRowKeyValue>
          <!-- MTU -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('mtu') }}
            </template>
            <template #value>
              {{ vif.MTU }}
            </template>
            <template #addons>
              <VtsCopyButton :value="String(vif.MTU)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- LOCKING MODE -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('locking-mode') }}
            </template>
            <template #value>
              {{ vif.lockingMode }}
            </template>
          </VtsCardRowKeyValue>
          <!-- TX CHECK SUMMING -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ t('check-summing') }}
            </template>
            <template #value>
              {{ vif.txChecksumming }}
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
              {{ vif.MAC }}
            </template>
            <template #addons>
              <VtsCopyButton :value="vif.MAC" />
            </template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { useVmStore } from '@/stores/xo-rest-api/vm.store'
import type { XoVif } from '@/types/xo/vif.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store.ts'
import { faAngleLeft, faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: XoVif }>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { get: getNetwork } = useNetworkStore().subscribe()
const { get: getVm } = useVmStore().subscribe()
const uiStore = useUiStore()

const ipAddresses = computed(() => {
  const addresses = getVm(vif.$VM)?.addresses

  return addresses ? [...new Set(Object.values(addresses).sort())] : []
})

const network = computed(() => getNetwork(vif.$network))

const status = computed(() => (vif.attached ? 'connected' : 'disconnected'))
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

  .action-buttons {
    display: flex;
    align-items: center;
  }
}
</style>
