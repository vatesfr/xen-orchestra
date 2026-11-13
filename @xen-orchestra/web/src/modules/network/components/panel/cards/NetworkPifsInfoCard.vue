<template>
  <UiPanelCard v-if="pifsCount && pifsCount > 0" ref="card" class="network-pifs-info-card">
    <UiPanelCardTitle size="medium" :label="t('pifs')" :counter="pifsCount" />
    <table class="simple-table" :class="{ compact: isCompact }">
      <thead>
        <tr>
          <th class="typo-body-regular-small">
            {{ t('host') }}
          </th>
          <th class="typo-body-regular-small device">
            {{ t('device') }}
          </th>
          <th v-tooltip="isCompact" class="typo-body-regular-small status" :class="{ 'text-ellipsis': isCompact }">
            {{ t('pifs-status') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <PifRow v-for="pif in pifs" :key="pif.id" :pif :compact="isCompact" />
      </tbody>
    </table>
  </UiPanelCard>
</template>

<script setup lang="ts">
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import PifRow from '@/modules/pif/components/PifRow.vue'
import { useXoPifCollection } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useElementSize } from '@vueuse/core'
import { computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { network } = defineProps<{
  network: FrontXoNetwork
}>()

const COMPACT_MAX_WIDTH = 400

const { t } = useI18n()

const { getPifsByNetworkId } = useXoPifCollection()

const pifs = computed(() => getPifsByNetworkId(network.id))

const pifsCount = computed(() => pifs.value.length)

const { width } = useElementSize(useTemplateRef('card'))

const isCompact = computed(() => width.value > 0 && width.value < COMPACT_MAX_WIDTH)
</script>

<style scoped lang="postcss">
.network-pifs-info-card {
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
}
</style>
