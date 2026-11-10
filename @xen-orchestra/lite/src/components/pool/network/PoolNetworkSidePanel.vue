<template>
  <VtsSidePanel :has-selection="!!network" class="pool-network-side-panel" @close="emit('close')">
    <template v-if="network && network.PIFs.length === 0" #actions>
      <VtsDeleteButton :busy="isDeletingNetworks" @click="deleteNetworks()" />
    </template>
    <template v-if="network" #corner-actions>
      <VtsCopyButton :value="networkAsJson" :label="t('action:copy-info-json')" />
    </template>
    <template v-if="network" #default>
      <UiPanelCard>
        <UiPanelCardTitle :id="network.uuid" size="medium" :label="network.name_label" />
        <VtsCardRowList>
          <!-- DESCRIPTION -->
          <VtsCardRowKeyValue truncate align-top>
            <template #key>{{ t('description') }}</template>
            <template #value>
              <span class="value">{{ network.name_description }}</span>
            </template>
            <template v-if="network.name_description" #addons>
              <VtsCopyButton :value="network.name_description" />
            </template>
          </VtsCardRowKeyValue>
          <!-- VLAN -->
          <VtsCardRowKeyValue v-if="networkVlan">
            <template #key>{{ t('vlan') }}</template>
            <template #value>{{ networkVlan }}</template>
            <template #addons>
              <VtsCopyButton :value="String(networkVlan)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- MTU -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('mtu') }}</template>
            <template #value>
              <span>{{ network.MTU }}</span>
            </template>
            <template #addons>
              <VtsCopyButton :value="String(network.MTU)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- NBD -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('network-block-device') }}</template>
            <template #value>{{ networkNbd }}</template>
            <template #addons>
              <VtsCopyButton :value="networkNbd" />
            </template>
          </VtsCardRowKeyValue>
          <!-- DEFAULT LOCKING MODE -->
          <VtsCardRowKeyValue>
            <template #key>{{ t('locking-mode-default') }}</template>
            <template #value>{{ networkDefaultLockingMode }}</template>
          </VtsCardRowKeyValue>
        </VtsCardRowList>
      </UiPanelCard>
      <UiPanelCard v-if="pifsCount && pifsCount > 0" ref="pifsCard">
        <UiPanelCardTitle size="medium" :label="t('pifs')" :counter="pifsCount" />
        <table class="simple-table" :class="{ compact: isPifsCardCompact }">
          <thead>
            <tr>
              <th class="typo-body-regular-small">
                {{ t('host') }}
              </th>
              <th class="typo-body-regular-small device">
                {{ t('device') }}
              </th>
              <th
                v-tooltip="isPifsCardCompact"
                class="typo-body-regular-small status"
                :class="{ 'text-ellipsis': isPifsCardCompact }"
              >
                {{ t('pifs-status') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <PifRow v-for="pif in pifs" :key="pif.uuid" :pif :compact="isPifsCardCompact" />
          </tbody>
        </table>
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import PifRow from '@/components/pif/PifRow.vue'
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { useNetworkDelete } from '@/modules/network/composables/use-network-delete.composable.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsDeleteButton from '@core/components/delete-button/VtsDeleteButton.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useElementSize } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network?: XenApiNetwork
}>()

const emit = defineEmits<{
  close: []
}>()

const { getPifsByNetworkRef } = usePifStore().subscribe()

const { t } = useI18n()

const { deleteNetworks, isDeletingNetworks } = useNetworkDelete(() => (network !== undefined ? [network] : []))

const pifs = computed(() => (network !== undefined ? getPifsByNetworkRef(network.$ref) : []))

const networkVlan = computed(() => {
  if (pifs.value.length === 0) {
    return
  }

  return pifs.value[0].VLAN !== -1 ? pifs.value[0].VLAN.toString() : t('none')
})

const networkNbd = computed(() => (network?.purpose[0] ? t('on') : t('off')))

const networkDefaultLockingMode = computed(() =>
  network?.default_locking_mode === 'disabled' ? t('disabled') : t('unlocked')
)

const pifsCount = computed(() => pifs.value.length)

const networkAsJson = computed(() => JSON.stringify(network))

const PIFS_CARD_COMPACT_MAX_WIDTH = 400

const { width: pifsCardWidth } = useElementSize(useTemplateRef('pifsCard'))

const isPifsCardCompact = computed(() => pifsCardWidth.value > 0 && pifsCardWidth.value < PIFS_CARD_COMPACT_MAX_WIDTH)
</script>

<style scoped lang="postcss">
.pool-network-side-panel {
  .simple-table {
    border-spacing: 0;
    padding: 0.4rem;

    th {
      text-align: start;
      color: var(--color-neutral-txt-secondary);
    }

    &.compact {
      width: 100%;
      table-layout: fixed;

      .device {
        width: 7.6rem;
        padding-inline-start: 1.6rem;
      }

      .status {
        width: 4rem;
      }
    }
  }

  .value:empty::before {
    content: '-';
  }
}
</style>
