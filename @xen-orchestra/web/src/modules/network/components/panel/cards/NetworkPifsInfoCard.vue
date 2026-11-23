<template>
  <UiPanelCard v-if="pifsCount > 0" ref="card" class="network-pifs-info-card">
    <UiPanelCardTitle size="medium" :label="t('pifs')" :counter="pifsCount">
      <template v-if="isCrossPool" #more-actions>
        <span class="pools-count typo-body-regular-small">{{ t('n-pools', poolGroups.length) }}</span>
      </template>
    </UiPanelCardTitle>
    <template v-for="group in visiblePoolGroupItems" :key="group.network.id">
      <VtsDivider v-if="isCrossPool" type="stretch" />
      <div v-if="isCrossPool" class="pool-header" :class="{ current: group.isCurrent }">
        <UiButtonIcon
          :icon="group.toggleIcon"
          size="small"
          accent="brand"
          :target-scale="2"
          @click="toggleNetwork(group.network.id)"
        />
        <div class="pool-name">
          <UiLink v-if="group.pool" :to="group.poolRoute" size="small" icon="object:pool" class="pool-link">
            <span v-tooltip class="text-ellipsis">{{ group.pool.name_label }}</span>
          </UiLink>
          <span v-if="group.isCurrent" class="this-pool typo-body-bold-small">
            {{ t('this-pool') }}
          </span>
        </div>
        <VtsInlineParts separator="bullet" class="summary typo-body-regular-small">
          <VtsStatus :status="group.status" />
          <span>{{ t('n-pifs', group.pifs.length) }}</span>
        </VtsInlineParts>
      </div>
      <table v-if="group.isTableVisible" class="simple-table" :class="{ compact: isCompact, nested: isCrossPool }">
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
          <PifRow v-for="pif in group.pifs" :key="pif.id" :pif :compact="isCompact" />
        </tbody>
      </table>
    </template>
    <UiButton
      v-if="hasHiddenPoolGroups"
      accent="brand"
      class="toggle"
      size="small"
      variant="tertiary"
      @click="toggleAllPoolGroups()"
    >
      {{ allPoolGroupsToggleLabel }}
    </UiButton>
  </UiPanelCard>
</template>

<script setup lang="ts">
import { useXoNetworkPoolGroups } from '@/modules/network/composables/xo-network-pool-groups.composable.ts'
import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import PifRow from '@/modules/pif/components/PifRow.vue'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsInlineParts from '@core/components/inline-parts/VtsInlineParts.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
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

const {
  isCrossPool,
  poolGroups,
  pifsCount,
  visiblePoolGroupItems,
  hasHiddenPoolGroups,
  allPoolGroupsToggleLabel,
  toggleNetwork,
  toggleAllPoolGroups,
} = useXoNetworkPoolGroups(() => network)

const { width } = useElementSize(useTemplateRef('card'))

const isCompact = computed(() => width.value > 0 && width.value < COMPACT_MAX_WIDTH)
</script>

<style scoped lang="postcss">
.network-pifs-info-card {
  .pools-count {
    color: var(--color-neutral-txt-secondary);
  }

  .toggle {
    align-self: start;
  }

  .pool-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    column-gap: 0.8rem;
    row-gap: 0.4rem;
    margin-inline: -1.6rem;
    padding: 0.4rem 1.6rem;

    &.current {
      background-color: var(--color-brand-background-selected);
    }

    .pool-name {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      min-width: 0;
    }

    .pool-link {
      min-width: 0;
    }

    .this-pool {
      margin-inline-start: auto;
      text-align: right;
      color: var(--color-brand-txt-base);
    }

    .summary {
      grid-column: 2;
      display: flex;
      align-items: baseline;
      color: var(--color-neutral-txt-secondary);
    }
  }

  .simple-table {
    border-spacing: 0;
    padding: 0.4rem;

    th {
      text-align: start;
      color: var(--color-neutral-txt-secondary);
    }

    &.nested {
      padding-inline-start: 3.2rem;
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
