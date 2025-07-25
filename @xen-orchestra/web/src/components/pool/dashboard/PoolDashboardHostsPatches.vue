<template>
  <UiCard class="pool-dashboard-patches">
    <div class="title">
      <UiCardTitle>
        {{ t('patches') }}
      </UiCardTitle>
      <div v-if="!noMissingPatches" class="typo-body-regular-small count">
        {{ t('n-missing', missingPatches.length) }}
      </div>
    </div>
    <VtsLoadingHero v-if="!areMissingPatchesReady" type="card" />
    <VtsAllDoneHero v-else-if="noMissingPatches" type="card" />
    <div v-else class="table-wrapper">
      <VtsDataTable is-ready class="table">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon accent="brand" :icon="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr v-for="row of rows" :key="row.id">
            <td v-for="column of row.visibleColumns" :key="column.id">
              <div>
                <div v-tooltip class="typo-body-bold text-ellipsis">
                  <div :class="{ version: column.id === 'version' }">
                    {{ column.value }}
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoPoolDashboard } from '@/types/xo/pool-dashboard.type.ts'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsAllDoneHero from '@core/components/state-hero/VtsAllDoneHero.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAlignLeft, faHashtag } from '@fortawesome/free-solid-svg-icons'
import { computed, type ComputedRef, useId } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
}>()

const { t } = useI18n()

const areMissingPatchesReady = computed(() => poolDashboard?.hosts?.missingPatches !== undefined)

const missingPatches = computed(() => {
  if (poolDashboard?.hosts?.missingPatches?.hasAuthorization) {
    return poolDashboard?.hosts?.missingPatches?.missingPatches ?? []
  }

  return []
})

const nMissingPatches = computed(() => missingPatches.value.length)

const noMissingPatches = computed(() => nMissingPatches.value === 0)

const { visibleColumns, rows } = useTable(
  'missingPatches',
  missingPatches as ComputedRef<{ name: string; version?: string }[]>,
  {
    rowId: () => useId(),
    columns: define => [define('name', { label: t('name') }), define('version', { label: t('version') })],
  }
)

const headerIcon: Record<'name' | 'version', IconDefinition> = {
  name: faAlignLeft,
  version: faHashtag,
}
</script>

<style lang="postcss" scoped>
.pool-dashboard-patches {
  max-height: 46.2rem;

  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .count {
    color: var(--color-danger-txt-base);
  }

  .table-wrapper {
    overflow-y: auto;
    margin-inline: -2.4rem;
    margin-block-end: -1.2rem;
    border-block: 0.1rem solid var(--color-neutral-border);

    .table {
      margin-top: -0.1rem;
    }
  }

  .version {
    text-align: end;
  }
}
</style>
