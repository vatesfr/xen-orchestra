<template>
  <UiCard :has-error>
    <UiCardTitle>
      {{ t('backup-issues') }}
      <UiCounter :value="nBackupIssues" accent="danger" size="medium" variant="primary" />
      <template #description>{{ t('in-last-three-runs') }}</template>
    </UiCardTitle>
    <VtsStateHero v-if="!areBackupIssuesReady" format="card" busy size="medium" />
    <VtsStateHero v-else-if="!hasBackupIssues" format="card" type="no-data" size="extra-small" horizontal>
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <div v-else class="backup-items">
      <VtsDataTable is-ready>
        <template #thead>
          <tr>
            <template v-for="column of visibleColumns" :key="column.id">
              <th>
                <div v-tooltip class="text-ellipsis">
                  <VtsIcon :name="headerIcon[column.id]" size="medium" />
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
                <VtsIcon name="fa:floppy-disk" size="medium" />
                <div v-if="column.value !== undefined" v-tooltip class="text-ellipsis">
                  <!-- TODO add RouterLink and Icon when backup page is available -->
                  <div class="typo-body-bold">
                    {{ column.value }}
                  </div>
                </div>
              </div>
              <div v-else-if="column.value">
                <ul class="last-three-runs">
                  <li v-for="(status, index) in column.value" :key="index" v-tooltip="status.tooltip">
                    <VtsIcon size="medium" :name="status.icon" />
                  </li>
                </ul>
              </div>
            </td>
          </tr>
        </template>
      </VtsDataTable>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import type { XoBackupLog } from '@/types/xo/backup-log.type.ts'
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
import type { IconName } from '@core/icons'
import VtsDataTable from '@core/components/data-table/VtsDataTable.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiCounter from '@core/components/ui/counter/UiCounter.vue'
import { useTable } from '@core/composables/table.composable.ts'
import { vTooltip } from '@core/directives/tooltip.directive'
import { createMapper } from '@core/packages/mapper'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { issues } = defineProps<{
  issues: NonNullable<XoDashboard['backups']>['issues'] | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areBackupIssuesReady = computed(() => issues !== undefined)

const backupIssues = computed(() => issues ?? [])

const getRunStatus = createMapper<XoBackupLog['status'], { icon: IconName; tooltip: string }>(
  {
    success: { icon: 'legacy:status:success', tooltip: t('success') },
    skipped: { icon: 'legacy:status:warning', tooltip: t('skipped') },
    interrupted: { icon: 'legacy:status:danger', tooltip: t('interrupted') },
    failure: { icon: 'legacy:status:danger', tooltip: t('failure') },
    pending: { icon: 'legacy:status:info', tooltip: t('in-progress') },
  },
  'failure'
)

const { visibleColumns, rows } = useTable('backupIssues', backupIssues, {
  rowId: record => record.uuid,
  columns: define => [
    define('name', { label: t('job-name') }),
    define('last-runs', record => (record.logs ?? []).map(log => getRunStatus(log)), {
      label: t('last-n-runs', { n: 3 }),
    }),
  ],
})

const headerIcon: Record<string, IconName> = {
  name: 'fa:floppy-disk',
  'last-runs': 'fa:square-caret-down',
}
const nBackupIssues = computed(() => backupIssues.value.length)

const hasBackupIssues = computed(() => nBackupIssues.value > 0)
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

  .last-three-runs {
    display: flex;
    gap: 0.8rem;
    align-items: center;
  }
}
</style>
