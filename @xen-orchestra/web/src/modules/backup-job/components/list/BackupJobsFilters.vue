<template>
  <div class="backup-jobs-filters">
    <UiDropdownButton
      v-if="uiStore.isSmall"
      :selected="areFiltersOpen"
      size="small"
      variant="secondary"
      @click="areFiltersOpen = !areFiltersOpen"
    >
      {{ t('filters') }}
    </UiDropdownButton>
    <UiActionsTitle v-else>{{ t('filters') }}</UiActionsTitle>
    <div v-if="!uiStore.isSmall || areFiltersOpen" class="filter-selects">
      <VtsFilterSelect :id="statusSelectId">{{ t('status') }}</VtsFilterSelect>
      <VtsFilterSelect :id="lastRunsStatusSelectId">
        {{ t('last-n-runs', BACKUP_JOB_LAST_RUNS_COUNT) }}
      </VtsFilterSelect>
      <VtsFilterSelect :id="lastDaysStatusSelectId">
        {{ t('last-n-days', BACKUP_JOB_LAST_DAYS_COUNT) }}
      </VtsFilterSelect>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  BACKUP_JOB_LAST_DAYS_COUNT,
  BACKUP_JOB_LAST_RUNS_COUNT,
} from '@/modules/backup-job/utils/xo-backup-job.util.ts'
import type { FormSelectId } from '@core/packages/form-select'
import VtsFilterSelect from '@core/components/select/VtsFilterSelect.vue'
import UiActionsTitle from '@core/components/ui/actions-title/UiActionsTitle.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  statusSelectId: FormSelectId
  lastRunsStatusSelectId: FormSelectId
  lastDaysStatusSelectId: FormSelectId
}>()

const { t } = useI18n()

const uiStore = useUiStore()

const areFiltersOpen = ref(false)
</script>

<style lang="postcss" scoped>
.backup-jobs-filters {
  display: flex;
  align-items: center;
  gap: 1.6rem;

  .filter-selects {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
  }

  @media (--small) {
    &,
    .filter-selects {
      flex-direction: column;
      align-items: flex-start;
    }
  }

  @media (--large) {
    display: grid;
    grid-template-columns: subgrid;

    .filter-selects {
      grid-column: 2 / -1;
      margin-inline-start: 1.9rem;
    }
  }
}
</style>
