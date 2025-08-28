<template>
  <UiCard class="pool-dashboard-patches">
    <div class="title">
      <UiCardTitle>
        {{ t('patches') }}
        <template v-if="!noMissingPatches" #info>
          <span class="missing-patches-info"> {{ t('n-missing', missingPatches.length) }}</span>
        </template>
      </UiCardTitle>
    </div>
    <VtsStateHero v-if="!areMissingPatchesReady" format="card" busy />
    <VtsStateHero v-else-if="noMissingPatches" format="card" type="all-done" image-size="small">
      <span> {{ t('all-good') }} </span>
      <span>{{ t('patches-up-to-date') }}</span>
    </VtsStateHero>
    <div v-else class="table-wrapper">
      <VtsDataTable is-ready class="table">
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon size="medium" :name="headerIcon[column.id]" />
                  {{ column.label }}
                </div>
              </th>
            </template>
          </tr>
        </template>
        <template #tbody>
          <tr v-for="row of rows" :key="row.id">
            <td v-for="column of row.visibleColumns" :key="column.id">
              <div v-tooltip class="text-ellipsis" :class="{ version: column.id === 'version' }">
                {{ column.value }}
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
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed, type ComputedRef, useId } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolDashboard } = defineProps<{
  poolDashboard: XoPoolDashboard | undefined
  hasError?: boolean
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

const headerIcon: Record<'name' | 'version', IconName> = {
  name: 'fa:align-left',
  version: 'fa:hashtag',
}
</script>

<style lang="postcss" scoped>
.pool-dashboard-patches {
  max-height: 46.2rem;

  .missing-patches-info {
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
