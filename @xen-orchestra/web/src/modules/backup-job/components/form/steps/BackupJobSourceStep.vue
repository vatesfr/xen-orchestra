<template>
  <div class="backup-job-source-step">
    <BackupJobFormRadio v-bind="bindings.dataSource" />
    <BackupJobFormRadio v-if="!isMetadata" v-bind="bindings.mode" />
    <div v-if="isMetadata" class="options">
      <UiLabel accent="neutral">{{ t('options') }}</UiLabel>
      <BackupJobFormCheckbox v-bind="bindings.saveXoConfig" />
      <BackupJobFormCheckbox v-bind="bindings.savePoolsMetadata" />
    </div>
    <template v-if="bindings.dataSource.modelValue === 'mirror'">
      <BackupJobFormSelect v-bind="bindings.proxy" />
      <BackupJobFormSelect v-bind="bindings.sourceBackupRepository" />
    </template>
    <BackupJobFormRadio v-if="!isMetadata || bindings.savePoolsMetadata.modelValue" v-bind="bindings.scopeType">
      <template v-if="!isMetadata" #info>
        <UiInfo wrap accent="info">{{ t('replications-excluded-from-selection') }}</UiInfo>
      </template>
    </BackupJobFormRadio>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import type { BackupJobSourceForm } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { bindings } = defineProps<{
  bindings: BackupJobSourceForm['bindings']
}>()

const { t } = useI18n()

const isMetadata = computed(() => bindings.dataSource.modelValue === 'metadata')
</script>

<style lang="postcss" scoped>
.backup-job-source-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .options {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
