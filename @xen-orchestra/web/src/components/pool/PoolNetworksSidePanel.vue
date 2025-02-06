<template>
  <UiPanel>
    <template v-if="network" #header>
      <UiButton
        v-tooltip="$t('coming-soon')"
        disabled
        variant="tertiary"
        size="medium"
        accent="info"
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
      <UiButtonIcon v-tooltip="$t('coming-soon')" disabled accent="info" size="medium" :icon="faEllipsis" />
    </template>
    <template #default>
      <VtsNoSelectionHero v-if="!network" type="panel" />
      <template v-else>
        <UiCard class="card-container">
          <UiCardTitle v-tooltip="{ placement: 'bottom-end' }" class="typo p1-medium text-ellipsis">
            {{ network.name_label }}
          </UiCardTitle>
          <div class="content">
            <!-- ID -->
            <VtsCardRowKeyValue>
              <template #key>
                {{ $t('id') }}
              </template>
              <template #value>{{ formatValue(network.id) }}</template>
              <template #addons>
                <UiButtonIcon
                  v-if="network.id"
                  v-tooltip="copied && $t('core.copied')"
                  accent="info"
                  size="medium"
                  :icon="faCopy"
                  @click="copy(network.id)"
                />
              </template>
            </VtsCardRowKeyValue>
            <!-- DESCRIPTION -->
            <VtsCardRowKeyValue>
              <template #key>{{ $t('description') }}</template>
              <template #value>{{ formatValue(network.name_description) }}</template>
              <template #addons>
                <UiButtonIcon
                  v-if="network.name_description"
                  v-tooltip="copied && $t('core.copied')"
                  accent="info"
                  size="medium"
                  :icon="faCopy"
                  @click="copy(network.name_description)"
                />
              </template>
            </VtsCardRowKeyValue>
            <!-- VLAN -->
            <VtsCardRowKeyValue>
              <template #key>{{ $t('vlan') }}</template>
              <template #value>{{ formatValue(networkVlan) }}</template>
              <template #addons>
                <UiButtonIcon
                  v-if="networkVlan"
                  v-tooltip="copied && $t('core.copied')"
                  accent="info"
                  size="medium"
                  :icon="faCopy"
                  @click="copy(String(networkVlan))"
                />
              </template>
            </VtsCardRowKeyValue>
            <!-- MTU -->
            <VtsCardRowKeyValue>
              <template #key>{{ $t('mtu') }}</template>
              <template #value>{{ formatValue(network.MTU) }}</template>
              <template #addons>
                <UiButtonIcon
                  v-if="network.MTU"
                  v-tooltip="copied && $t('core.copied')"
                  accent="info"
                  size="medium"
                  :icon="faCopy"
                  @click="copy(String(network.MTU))"
                />
              </template>
            </VtsCardRowKeyValue>
            <!-- NBD -->
            <VtsCardRowKeyValue>
              <template #key>{{ $t('network-block-device') }}</template>
              <template #value>{{ networkNbd }}</template>
              <template #addons>
                <UiButtonIcon
                  v-tooltip="copied && $t('core.copied')"
                  accent="info"
                  size="medium"
                  :icon="faCopy"
                  @click="copy(networkNbd)"
                />
              </template>
            </VtsCardRowKeyValue>
            <!-- DEFAULT LOCKING MODE -->
            <VtsCardRowKeyValue>
              <template #key>{{ $t('locking-mode-default') }}</template>
              <template #value>{{ networkDefaultLockingMode }}</template>
            </VtsCardRowKeyValue>
          </div>
        </UiCard>
        <UiCard v-if="network?.PIFs?.length > 0" class="card-container">
          <div class="typo p1-medium">
            {{ $t('pifs') }}
            <UiCounter v-if="pifsCount" :value="pifsCount" variant="primary" size="small" accent="neutral" />
          </div>
          <table class="simple-table">
            <thead>
              <tr>
                <th class="text-left typo p3-regular">
                  {{ $t('host') }}
                </th>
                <th class="text-left typo p3-regular">
                  {{ $t('device') }}
                </th>
                <th class="text-left typo p3-regular">
                  {{ $t('pifs-status') }}
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
    </template>
  </UiPanel>
</template>

<script setup lang="ts">
import PifRow from '@/components/pif/PifRow.vue'
import { useNetworkStore } from '@/stores/xo-rest-api/network.store'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsNoSelectionHero from '@core/components/state-hero/VtsNoSelectionHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { useRouteQuery } from '@core/composables/route-query.composable'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCopy, faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { records: networks } = useNetworkStore().subscribe()
const { pifsByNetwork } = usePifStore().subscribe()
const { t } = useI18n()

const networkId = useRouteQuery('id')
const network = computed(() => networks.value.find(network => network.id === networkId.value))

const pifs = computed(() => {
  const networkId = network.value?.id
  return networkId ? (pifsByNetwork.value.get(networkId) ?? []) : []
})

const networkVlan = computed(() => {
  if (pifs.value.length === 0) {
    return ''
  }
  return pifs.value[0].vlan !== -1 ? pifs.value[0].vlan.toString() : ''
})

const networkNbd = computed(() => (network?.value?.nbd ? t('on') : t('off')))

const networkDefaultLockingMode = computed(() =>
  network?.value?.default_locking_mode === 'disabled' ? t('disabled') : t('unlocked')
)

const pifsCount = computed(() => pifs.value.length)

const formatValue = (value?: string | number): string => {
  return value ? String(value) : '-'
}

const { copy, copied } = useClipboard()
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

    tbody tr {
      cursor: pointer;

      &:hover {
        background-color: var(--color-info-background-hover);
      }
    }

    thead tr th {
      color: var(--color-neutral-txt-secondary);
    }

    tbody tr td {
      color: var(--color-neutral-txt-primary);
    }
  }
}
</style>
