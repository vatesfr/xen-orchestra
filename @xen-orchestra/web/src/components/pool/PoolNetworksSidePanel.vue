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
        <UiCardTitle v-tooltip="{ placement: 'bottom-end' }" class="typo p1-medium text-ellipsis">
          {{ network.name_label }}
        </UiCardTitle>
        <div class="content">
          <!-- ID -->
          <VtsCardRowKeyValue>
            <template #key>
              {{ $t('id') }}
            </template>
            <template #value>
              <div class="value">
                {{ network.id }}
              </div>
            </template>
            <template v-if="network.id" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                accent="brand"
                size="medium"
                :icon="faCopy"
                @click="copy(network.id)"
              />
            </template>
          </VtsCardRowKeyValue>
          <!-- DESCRIPTION -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('description') }}</template>
            <template #value>
              <div class="value">
                {{ network.name_description }}
              </div>
            </template>
            <template v-if="network.name_description" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                accent="brand"
                size="medium"
                :icon="faCopy"
                @click="copy(network.name_description)"
              />
            </template>
          </VtsCardRowKeyValue>
          <!-- VLAN -->
          <VtsCardRowKeyValue v-if="networkVlan">
            <template #key>{{ $t('vlan') }}</template>
            <template #value>{{ networkVlan }}</template>
            <template #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                accent="brand"
                size="medium"
                :icon="faCopy"
                @click="copy(String(networkVlan))"
              />
            </template>
          </VtsCardRowKeyValue>
          <!-- MTU -->
          <VtsCardRowKeyValue>
            <template #key>{{ $t('mtu') }}</template>
            <template #value>
              <div class="value">
                {{ network.mtu }}
              </div>
            </template>
            <template v-if="network.MTU" #addons>
              <UiButtonIcon
                v-tooltip="copied && $t('core.copied')"
                accent="brand"
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
                accent="brand"
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
      <UiCard v-if="pifsCount && pifsCount > 0" class="card-container">
        <div class="typo p1-medium">
          {{ $t('pifs') }}
          <UiCounter :value="pifsCount" variant="primary" size="small" accent="neutral" />
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
  </UiPanel>
</template>

<script setup lang="ts">
import PifRow from '@/components/pif/PifRow.vue'
import { usePifStore } from '@/stores/xo-rest-api/pif.store'
import type { XoNetwork } from '@/types/xo/network.type'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import { vTooltip } from '@core/directives/tooltip.directive'
import { faCopy, faEdit, faEllipsis, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useClipboard } from '@vueuse/core'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: XoNetwork
}>()

const { getPifsByNetworkRef } = usePifStore().subscribe()

const { t } = useI18n()

const pifs = computed(() => getPifsByNetworkRef(network.id))

const networkVlan = computed(() => {
  if (pifs.value.length === 0) {
    return ''
  }
  return pifs.value[0].vlan !== -1 ? pifs.value[0].vlan.toString() : t('none')
})

const networkNbd = computed(() => (network?.nbd ? t('on') : t('off')))

const networkDefaultLockingMode = computed(() =>
  network?.default_locking_mode === 'disabled' ? t('disabled') : t('unlocked')
)

const pifsCount = computed(() => pifs.value.length)

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
</style>
