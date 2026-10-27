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
        v-model:selected-ids="selectedIds"
        v-model:filter="filter"
        :mode="bindings.backupRepositoryScopeType.modelValue"
        :brs
        :compatible-brs="compatibleBrs"
        :matched-brs="matchedBrs"
        :error="
          bindings.backupRepositoryScopeType.modelValue === 'manual'
            ? bindings.backupRepositoryIds.error
            : bindings.backupRepositoryFilter.error
        "
      />
    </div>

    <BackupJobFormRadio v-bind="bindings.backupDistribution" vertical />

    <div class="block">
      <span class="typo-body-bold">{{ t('backup-retention') }}</span>
      <BackupJobFormRow>
        <BackupJobFormNumberInput v-bind="bindings.exportRetention" />
      </BackupJobFormRow>
    </div>

    <div class="block">
      <span class="typo-body-bold">{{ t('long-term-retention') }}</span>
      <BackupJobLongTermRetentionRow
        :retention="bindings.ltrDailyRetention.modelValue"
        :error="bindings.ltrDailyRetention.error"
        :period="t('long-term-retention:daily')"
        :keep-select-id="bindings.ltrDailyKeep.id"
        @update:retention="bindings.ltrDailyRetention['onUpdate:modelValue']($event)"
      />
      <BackupJobLongTermRetentionRow
        :retention="bindings.ltrWeeklyRetention.modelValue"
        :error="bindings.ltrWeeklyRetention.error"
        :period="t('long-term-retention:weekly')"
        :keep-select-id="bindings.ltrWeeklyKeep.id"
        @update:retention="bindings.ltrWeeklyRetention['onUpdate:modelValue']($event)"
      />
      <BackupJobLongTermRetentionRow
        :retention="bindings.ltrMonthlyRetention.modelValue"
        :error="bindings.ltrMonthlyRetention.error"
        :period="t('long-term-retention:monthly')"
        :keep-select-id="bindings.ltrMonthlyKeep.id"
        @update:retention="bindings.ltrMonthlyRetention['onUpdate:modelValue']($event)"
      />
      <BackupJobLongTermRetentionRow
        :retention="bindings.ltrYearlyRetention.modelValue"
        :error="bindings.ltrYearlyRetention.error"
        :period="t('long-term-retention:yearly')"
        :keep-select-id="bindings.ltrYearlyKeep.id"
        @update:retention="bindings.ltrYearlyRetention['onUpdate:modelValue']($event)"
      />
      <BackupJobFormCheckbox v-bind="bindings.strictGfs" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import BackupJobLongTermRetentionRow from '@/modules/backup-job/components/form/inputs/BackupJobLongTermRetentionRow.vue'
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
}>()

const { t } = useI18n()

const selectedIds = computed({
  get: () => bindings.backupRepositoryIds.modelValue,
  set: ids => bindings.backupRepositoryIds['onUpdate:modelValue'](ids),
})

const filter = computed({
  get: () => bindings.backupRepositoryFilter.modelValue,
  set: value => bindings.backupRepositoryFilter['onUpdate:modelValue'](value),
})
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
