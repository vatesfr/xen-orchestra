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
      <!-- VIF -->
      <UiCard class="card">
        <UiCardTitle>{{ t('vif') }}</UiCardTitle>
        <div class="content">
          <!-- UUID -->
          <UiLabelValue :label="t('uuid')" :value="vif.id" :copy-value="vif.id" />
          <!-- NETWORK -->
          <UiLabelValue :label="t('network')" :value="network?.name_label" :copy-value="network?.name_label" wrap>
            <!-- TODO Remove the span when the link works and the icon is fixed -->
            <!--
              <UiComplexIcon size="medium">
                <VtsIcon :icon="faNetworkWired" accent="current" />
                <VtsIcon accent="success" :icon="faCircle" :overlay-icon="faCheck" />
              </UiComplexIcon>
              <a href="">{{ networkNameLabel }}</a>
              -->
          </UiLabelValue>
          <!-- DEVICE -->
          <UiLabelValue
            :label="t('device')"
            :value="t('vif-device', { device: vif.device })"
            :copy-value="vif.device"
          />
          <!-- VIF STATUS -->
          <UiLabelValue :label="t('vif-status')">
            <template #value>
              <VtsConnectionStatus :status />
            </template>
          </UiLabelValue>
          <!-- MTU -->
          <UiLabelValue :label="t('mtu')" :value="String(vif.MTU)" :copy-value="String(vif.MTU)" />
          <!-- LOCKING MODE -->
          <UiLabelValue :label="t('locking-mode')" :value="vif.lockingMode" />
          <!-- TX CHECK SUMMING -->
          <UiLabelValue :label="t('check-summing')" :value="String(vif.txChecksumming)" />
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
                  icon="fa:ellipsis"
                  size="medium"
                  accent="brand"
                />
              </template>
            </VtsCardRowKeyValue>
          </template>
          <UiLabelValue v-else :label="t('ip-addresses')" :value="ipAddresses" />
          <!-- MAC ADDRESSES -->
          <UiLabelValue :label="t('mac-address')" :value="vif.MAC" :copy-value="vif.MAC" />
        </div>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import { useXoNetworkCollection } from '@/remote-resources/use-xo-network-collection.ts'
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoVif } from '@/types/xo/vif.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsConnectionStatus from '@core/components/connection-status/VtsConnectionStatus.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vif } = defineProps<{ vif: XoVif }>()

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

const { useGetNetworkById } = useXoNetworkCollection()
const { getVmById } = useXoVmCollection()
const uiStore = useUiStore()

const ipAddresses = computed(() => {
  const addresses = getVmById(vif.$VM)?.addresses

  return addresses ? [...new Set(Object.values(addresses).sort())] : []
})

const network = useGetNetworkById(() => vif.$network)

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
}

.action-buttons {
  display: flex;
  align-items: center;
}
</style>
