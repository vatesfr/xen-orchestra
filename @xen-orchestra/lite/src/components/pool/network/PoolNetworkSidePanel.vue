<template>
  <UiPanel>
    <template #header>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="brand"
        :left-icon="faEdit"
      >
        {{ $t('edit') }}
      </UiButton>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="danger"
        :left-icon="faTrash"
      >
        {{ $t('delete') }}
      </UiButton>
      <UiButtonIcon v-tooltip="$t('coming-soon')" disabled accent="brand" size="medium" :icon="faEllipsis" />
    </template>
    <template #default>
      <UiCard class="card-container">
        <UiCardTitle v-tooltip="{ placement: 'bottom-end' }" class="typo-body-bold text-ellipsis">
          {{ network.name_label }}
        </UiCardTitle>
        <div class="content">
          <!-- UUID -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('uuid') }}
            </template>
            <template #value>{{ network.uuid }}</template>
            <template #addons>
              <UiCopyButton :copy-element="network.uuid" />
            </template>
          </VtsCardRowKeyValue>
          <!-- DESCRIPTION -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('description') }}</template>
            <template #value>
              <span class="value">{{ network.name_description }}</span>
            </template>
            <template v-if="network.name_description" #addons>
              <UiCopyButton :copy-element="network.name_description" />
            </template>
          </VtsCardRowKeyValue>
          <!-- VLAN -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('vlan') }}</template>
            <template #value>{{ networkVlan }}</template>
            <template v-if="pifs[0].VLAN !== -1" #addons>
              <UiCopyButton :copy-element="String(networkVlan)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- MTU -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('mtu') }}</template>
            <template #value>
              <span>{{ network.MTU }}</span>
            </template>
            <template #addons>
              <UiCopyButton :copy-element="String(network.MTU)" />
            </template>
          </VtsCardRowKeyValue>
          <!-- NBD -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('network-block-device') }}</template>
            <template #value>{{ networkNbd }}</template>
            <template #addons>
              <UiCopyButton :copy-element="networkNbd" />
            </template>
          </VtsCardRowKeyValue>
          <!-- DEFAULT LOCKING MODE -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('locking-mode-default') }}</template>
            <template #value>{{ networkDefaultLockingMode }}</template>
          </VtsCardRowKeyValue>
        </div>
      </UiCard>
      <UiCard v-if="pifsCount && pifsCount > 0" class="card-container">
        <div class="typo-body-bold">
          {{ $t('pifs') }}
          <UiCounter :value="pifsCount" variant="primary" size="small" accent="neutral" />
        </div>
        <table class="simple-table">
          <thead>
            <tr>
              <th class="text-left typo-body-regular-small">
                {{ $t('host') }}
              </th>
              <th class="text-left typo-body-regular-small">
                {{ $t('device') }}
              </th>
              <th class="text-left typo-body-regular-small">
                {{ $t('pifs-status') }}
              </th>
              <th />
            </tr>
          </thead>
          <tbody>
            <PifRow v-for="pif in pifs" :key="pif.uuid" :pif />
          </tbody>
        </table>
      </UiCard>
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import PifRow from '@/components/pif/PifRow.vue'
import type { XenApiNetwork } from '@/libs/xen-api/xen-api.types'
import { usePifStore } from '@/stores/xen-api/pif.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCopyButton from '@core/components/ui/copy-button/UiCopyButton.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: XenApiNetwork
}>()

const { getPifsByNetworkRef } = usePifStore().subscribe()

const { t } = useI18n()

const pifs = computed(() => getPifsByNetworkRef(network.$ref))

const networkVlan = computed(() => {
  if (pifs.value.length === 0) {
    return ''
  }
  return pifs.value[0].VLAN !== -1 ? pifs.value[0].VLAN.toString() : t('none')
})

const networkNbd = computed(() => (network.purpose[0] ? t('on') : t('off')))

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
