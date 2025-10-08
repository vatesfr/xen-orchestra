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
          <UiButtonIcon v-tooltip="t('coming-soon')" disabled accent="brand" size="medium" icon="fa:ellipsis" />
        </div>
      </div>
    </template>
    <template #default>
      <UiCard class="card-container">
        <UiCardTitle v-tooltip="{ placement: 'bottom-end' }" class="typo-body-bold text-ellipsis">
          {{ network.name_label }}
        </UiCardTitle>
        <div class="content">
          <!-- ID -->
          <UiLabelValue :label="t('id')" :value="network.id">
            <template #actions>
              <VtsCopyButton :value="network.id" />
            </template>
          </UiLabelValue>
          <!-- DESCRIPTION -->
          <UiLabelValue :label="t('description')" :value="network.name_description" wrap>
            <template v-if="network.name_description" #actions>
              <VtsCopyButton :value="network.name_description" />
            </template>
          </UiLabelValue>
          <!-- VLAN -->
          <UiLabelValue v-if="networkVlan" :label="t('vlan')" :value="networkVlan">
            <template #actions>
              <VtsCopyButton :value="String(networkVlan)" />
            </template>
          </UiLabelValue>
          <!-- MTU -->
          <UiLabelValue :label="t('mtu')" :value="String(network.MTU)">
            <template #actions>
              <VtsCopyButton :value="String(network.MTU)" />
            </template>
          </UiLabelValue>
          <!-- NBD -->
          <UiLabelValue :label="t('network-block-device')" :value="networkNbd">
            <template #actions>
              <VtsCopyButton :value="networkNbd" />
            </template>
          </UiLabelValue>
          <!-- DEFAULT LOCKING MODE -->
          <UiLabelValue :label="t('locking-mode-default')" :value="networkDefaultLockingMode" />
        </div>
      </UiCard>
      <UiCard v-if="pifsCount && pifsCount > 0" class="card-container">
        <div class="typo-body-bold">
          {{ t('pifs') }}
          <UiCounter :value="pifsCount" variant="primary" size="small" accent="neutral" />
        </div>
        <table class="simple-table">
          <thead>
            <tr>
              <th class="text-left typo-body-regular-small">
                {{ t('host') }}
              </th>
              <th class="text-left typo-body-regular-small">
                {{ t('device') }}
              </th>
              <th class="text-left typo-body-regular-small">
                {{ t('pifs-status') }}
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            <PifRow v-for="pif in pifs" :key="pif.id" :pif />
          </tbody>
        </table>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import PifRow from '@/components/pif/PifRow.vue'
import { useXoPifCollection } from '@/remote-resources/use-xo-pif-collection.ts'
import type { XoNetwork } from '@/types/xo/network.type.ts'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiLabelValue from '@core/components/ui/label-value/UiLabelValue.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: XoNetwork
}>()

const emit = defineEmits<{
  close: []
}>()

const { getPifsByNetworkId } = useXoPifCollection()
const uiStore = useUiStore()

const { t } = useI18n()

const pifs = computed(() => getPifsByNetworkId(network.id))

const networkVlan = computed(() => {
  if (pifs.value.length === 0) {
    return
  }

  return pifs.value[0].vlan !== -1 ? pifs.value[0].vlan.toString() : t('none')
})

const networkNbd = computed(() => (network.nbd ? t('on') : t('off')))

const networkDefaultLockingMode = computed(() =>
  network.default_locking_mode === 'disabled' ? t('disabled') : t('unlocked')
)

const pifsCount = computed(() => pifs.value.length)
</script>

<style scoped lang="postcss">
.card-container {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .value:empty::before {
      content: '-';
    }
  }

  .text-left {
    text-align: left;
  }

  .simple-table {
    border-spacing: 0;
    padding: 0.4rem;

    thead tr th {
      color: var(--color-neutral-txt-secondary);
    }
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
