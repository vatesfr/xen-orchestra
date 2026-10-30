<template>
  <div class="backup-job-target-backup-repository-section">
    <UiTitle>{{ t('backup-repositories') }}</UiTitle>

    <div class="block">
      <span class="typo-body-bold">{{ t('general-information') }}</span>
      <BackupJobFormSelect v-bind="bindings.targetProxy" />
    </div>

    <div class="block">
      <BackupJobFormRadio v-bind="bindings.backupRepositoryScopeType" />
      <BackupJobTargetBackupRepositoryTable
        v-if="bindings.backupRepositoryScopeType.modelValue !== 'all'"
        :key="bindings.backupRepositoryScopeType.modelValue"
        :selected-ids="bindings.backupRepositoryIds.modelValue"
        :filter="bindings.backupRepositoryFilter.modelValue"
        :mode="bindings.backupRepositoryScopeType.modelValue"
        :brs
        :compatible-brs="compatibleBrs"
        :matched-brs="matchedBrs"
        :error="
          bindings.backupRepositoryScopeType.modelValue === 'manual'
            ? bindings.backupRepositoryIds.error
            : bindings.backupRepositoryFilter.error
        "
        @update:selected-ids="bindings.backupRepositoryIds['onUpdate:modelValue']($event)"
        @update:filter="bindings.backupRepositoryFilter['onUpdate:modelValue']($event)"
      />
    </div>

    <BackupJobFormRadio v-if="hasRetentionStrategy" v-bind="bindings.backupDistribution" vertical />

    <div class="block">
      <span class="typo-body-bold">{{ t('backup-retention') }}</span>
      <BackupJobFormRow>
        <BackupJobFormNumberInput v-bind="bindings.exportRetention" />
      </BackupJobFormRow>
    </div>

    <div v-if="hasRetentionStrategy" class="block">
      <span class="typo-body-bold">{{ t('long-term-retention') }}</span>
      <BackupJobFormLongTermRetentionRow
        v-for="row of longTermRetentionRows"
        :key="row.period"
        v-bind="row.retention"
        :period="t(`long-term-retention:${row.period}`)"
        :keep-select-id="row.keep.id"
      />
      <BackupJobFormCheckbox v-if="hasStrictGfs" v-bind="bindings.strictGfs" />
    </div>

    <BackupJobFormCheckbox v-if="hasRetentionStrategy" v-bind="bindings.mergeBackupsSynchronously" />
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormLongTermRetentionRow from '@/modules/backup-job/components/form/inputs/BackupJobFormLongTermRetentionRow.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import BackupJobTargetBackupRepositoryTable from '@/modules/backup-job/components/form/target/BackupJobTargetBackupRepositoryTable.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { bindings } = defineProps<{
  bindings: BackupJobTargetForm['bindings']
  brs: FrontXoBackupRepository[]
  compatibleBrs: FrontXoBackupRepository[]
  matchedBrs: FrontXoBackupRepository[]
  hasRetentionStrategy: boolean
  hasStrictGfs: boolean
}>()

const { t } = useI18n()

const longTermRetentionRows = computed(
  () =>
    [
      { period: 'daily', retention: bindings.ltrDailyRetention, keep: bindings.ltrDailyKeep },
      { period: 'weekly', retention: bindings.ltrWeeklyRetention, keep: bindings.ltrWeeklyKeep },
      { period: 'monthly', retention: bindings.ltrMonthlyRetention, keep: bindings.ltrMonthlyKeep },
      { period: 'yearly', retention: bindings.ltrYearlyRetention, keep: bindings.ltrYearlyKeep },
    ] as const
)
</script>

<style lang="postcss" scoped>
.backup-job-target-backup-repository-section {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;

  .block {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }
}
</style>
