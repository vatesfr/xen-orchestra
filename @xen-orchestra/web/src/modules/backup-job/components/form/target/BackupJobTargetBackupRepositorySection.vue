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
        v-if="bindings.backupRepositoryScopeType.modelValue === 'manual'"
        v-bind="bindings.backupRepositoryIds"
        :brs
        :compatible-brs="compatibleBrs"
        :busy
      />
      <BackupJobFormDynamicSelection
        v-else-if="bindings.backupRepositoryScopeType.modelValue === 'smart'"
        v-bind="bindings.backupRepositoryFilter"
        :schema
        :items="matchedBrItems"
        :count-label="t('n-brs', { n: matchedBrItems.length })"
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
import BackupJobFormDynamicSelection from '@/modules/backup-job/components/form/inputs/BackupJobFormDynamicSelection.vue'
import BackupJobFormLongTermRetentionRow from '@/modules/backup-job/components/form/inputs/BackupJobFormLongTermRetentionRow.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import BackupJobTargetBackupRepositoryTable from '@/modules/backup-job/components/form/target/BackupJobTargetBackupRepositoryTable.vue'
import type { BackupJobTargetBackupRepositoryForm } from '@/modules/backup-job/form/target/use-backup-job-target-backup-repository-form.ts'
import { LONG_TERM_RETENTION_FIELDS } from '@/modules/backup-job/utils/backup-job-long-term-retention.util.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { bindings } = defineProps<{
  bindings: BackupJobTargetBackupRepositoryForm['bindings']
  brs: FrontXoBackupRepository[]
  compatibleBrs: FrontXoBackupRepository[]
  matchedBrItems: QueryBuilderPreviewItem[]
  schema: QueryBuilderSchema
  busy: boolean
  hasRetentionStrategy: boolean
  hasStrictGfs: boolean
}>()

const { t } = useI18n()

const longTermRetentionRows = computed(() =>
  LONG_TERM_RETENTION_FIELDS.map(({ period, retention, keep }) => ({
    period,
    retention: bindings[retention],
    keep: bindings[keep],
  }))
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
