<template>
  <VtsSidePanel :has-selection="!!network" class="pool-network-side-panel" @close="emit('close')">
    <template v-if="network" #actions>
      <MenuList placement="bottom-end">
        <template #trigger="{ open, isOpen }">
          <UiButtonIcon
            v-tooltip="copied && t('copied')"
            accent="brand"
            size="small"
            :icon="copied ? 'fa:check-circle' : 'action:more-actions'"
            :selected="isOpen"
            @click="open($event)"
          />
        </template>
        <MenuItem accent="brand" icon="action:copy" :disabled="!isClipboardSupported" @click="copy()">
          {{ t('action:copy-info-json') }}
        </MenuItem>
      </MenuList>
    </template>
    <template v-if="network" #default>
      <UiPanelCard>
        <VtsCardObjectTitle :id="network.uuid" :label="network.name_label" />
        <div class="content">
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
        </div>
      </UiPanelCard>
      <UiPanelCard v-if="pifsCount && pifsCount > 0">
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
            <PifRow v-for="pif in pifs" :key="pif.uuid" :pif />
          </tbody>
        </table>
      </UiPanelCard>
    </template>
  </VtsSidePanel>
</template>

<script setup lang="ts">
import PifRow from '@/components/pif/PifRow.vue'
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types.ts'
import { usePifStore } from '@/stores/xen-api/pif.store.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network?: XenApiNetwork
}>()

const emit = defineEmits<{
  close: []
}>()

const { getPifsByNetworkRef } = usePifStore().subscribe()

const { t } = useI18n()

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

const { copy, copied, isSupported: isClipboardSupported } = useClipboard({ source: networkAsJson, legacy: true })
</script>

<style scoped lang="postcss">
.pool-network-side-panel {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
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

  .value:empty::before {
    content: '-';
  }
}
</style>
