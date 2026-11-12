<template>
  <div class="backup-job-target-storage-repository-section">
    <UiTitle>{{ t('storage-repositories') }}</UiTitle>

    <div class="block">
      <span class="typo-body-bold">{{ t('general-information') }}</span>
      <BackupJobFormRadio v-bind="bindings.storageRepositoryScopeType" />
      <BackupJobTargetStorageRepositoryTable
        v-if="bindings.storageRepositoryScopeType.modelValue === 'manual'"
        v-bind="bindings.storageRepositoryIds"
        :srs
        :busy
      />
      <BackupJobFormDynamicSelection
        v-else-if="bindings.storageRepositoryScopeType.modelValue === 'smart'"
        v-bind="bindings.storageRepositoryFilter"
        :schema
        :items="matchedSrItems"
        :count-label="t('n-srs', { n: matchedSrItems.length })"
      />
    </div>

    <BackupJobFormRadio v-bind="bindings.replicaDistribution" vertical />

    <div class="block">
      <span class="typo-body-bold">{{ t('retention') }}</span>
      <BackupJobFormRow>
        <BackupJobFormNumberInput v-bind="bindings.copyRetention" />
      </BackupJobFormRow>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormDynamicSelection from '@/modules/backup-job/components/form/inputs/BackupJobFormDynamicSelection.vue'
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobTargetStorageRepositoryTable from '@/modules/backup-job/components/form/target/BackupJobTargetStorageRepositoryTable.vue'
import type { BackupJobTargetStorageRepositoryForm } from '@/modules/backup-job/form/target/use-backup-job-target-storage-repository-form.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { QueryBuilderPreviewItem } from '@core/components/query-builder/VtsQueryBuilderPreview.vue'
import type { QueryBuilderSchema } from '@core/packages/query-builder/types.ts'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  bindings: BackupJobTargetStorageRepositoryForm['bindings']
  srs: FrontXoSr[]
  matchedSrItems: QueryBuilderPreviewItem[]
  schema: QueryBuilderSchema
  busy: boolean
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.backup-job-target-storage-repository-section {
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
