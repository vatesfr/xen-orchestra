<template>
  <UiCard>
    <UiCardTitle>
      {{ t('backup-issues') }}
      <UiCounter :value="backupIssues.length" accent="danger" size="medium" variant="primary" />
      <template #description>{{ t('in-last-three-jobs') }}</template>
    </UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <VtsNoDataHero v-else-if="!hasBackupIssues" type="card" />
    <div v-else class="backup-items">
      <VtsDataTable is-ready>
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th :class="{ logs: column.id.startsWith('logs-') }">
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
              <div v-if="column.id === 'name'" class="name">
                <VtsIcon accent="current" :icon="faFloppyDisk" />
                <div v-tooltip class="text-ellipsis">
                  <!-- TODO add RouterLink and Icon when backup page is available -->
                  <div class="typo-body-bold">
                    {{ column.value }}
                  </div>
                </div>
              </div>
              <div v-else-if="column.value">
                <VtsBackupState :state="column.value" />
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { useDashboardStore } from '@/stores/xo-rest-api/dashboard.store'
import VtsBackupState from '@core/components/backup-state/VtsBackupState.vue'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import VtsNoDataHero from '@core/components/state-hero/VtsNoDataHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faFloppyDisk, faSquareCaretDown } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { backupIssues, isReady } = useDashboardStore().subscribe()

const hasBackupIssues = computed(() => backupIssues.value.length !== 0)

const logLabels = [t('last'), t('2nd-last'), t('3rd-last')]

const { visibleColumns, rows } = useTable('backupIssues', backupIssues, {
  rowId: record => record.uuid,
  columns: define => [
    define('name', { label: t('job-name') }),
    ...logLabels.map((label, index) => define(`logs-${index}`, record => record.logs?.[index], { label })),
  ],
})

const headerIcon: Record<string, IconDefinition> = {
  name: faFloppyDisk,
  'logs-0': faSquareCaretDown,
  'logs-1': faSquareCaretDown,
  'logs-2': faSquareCaretDown,
}
</script>

<style lang="postcss" scoped>
.backup-items {
  max-height: 30rem;
  overflow-y: auto;
  margin-inline: -2.4rem;
  margin-block-end: -2.4rem;

  .name {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .logs {
    max-width: 1.5rem;
  }
}
</style>
