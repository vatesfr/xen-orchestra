<template>
  <div class="backup-job-target-storage-repository-section">
    <UiTitle>{{ t('storage-repositories') }}</UiTitle>

    <div class="block">
      <span class="typo-body-bold">{{ t('general-information') }}</span>
      <BackupJobFormRadio v-bind="bindings.storageRepositoryScopeType" />
      <BackupJobTargetStorageRepositoryTable
        v-if="bindings.storageRepositoryScopeType.modelValue !== 'all'"
        :key="bindings.storageRepositoryScopeType.modelValue"
        v-model:selected-ids="selectedIds"
        v-model:filter="filter"
        :mode="bindings.storageRepositoryScopeType.modelValue"
        :srs
        :matched-srs="matchedSrs"
        :error="
          bindings.storageRepositoryScopeType.modelValue === 'manual'
            ? bindings.storageRepositoryIds.error
            : bindings.storageRepositoryFilter.error
        "
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
import BackupJobFormNumberInput from '@/modules/backup-job/components/form/inputs/BackupJobFormNumberInput.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobTargetStorageRepositoryTable from '@/modules/backup-job/components/form/target/BackupJobTargetStorageRepositoryTable.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { bindings } = defineProps<{
  bindings: BackupJobTargetForm['bindings']
  srs: FrontXoSr[]
  matchedSrs: FrontXoSr[]
}>()

const { t } = useI18n()

const selectedIds = computed({
  get: () => bindings.storageRepositoryIds.modelValue,
  set: ids => bindings.storageRepositoryIds['onUpdate:modelValue'](ids),
})

const filter = computed({
  get: () => bindings.storageRepositoryFilter.modelValue,
  set: value => bindings.storageRepositoryFilter['onUpdate:modelValue'](value),
})
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
