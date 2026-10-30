<template>
  <div class="backup-job-source-step">
    <BackupJobFormRow>
      <BackupJobFormTextInput v-bind="bindings.name" />
    </BackupJobFormRow>
    <BackupJobFormRadio v-bind="bindings.dataSource" />
    <div v-if="!isMetadata" class="mode">
      <BackupJobFormRadio v-bind="bindings.mode" />
      <template v-if="isMirror">
        <BackupJobFormSelect v-bind="bindings.proxy" />
        <BackupJobFormSelect v-bind="bindings.sourceBackupRepository">
          <template #option="{ option }">
            <VtsOption :option>
              <span class="option-content">
                <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
                {{ option.properties.label }}
              </span>
            </VtsOption>
          </template>
        </BackupJobFormSelect>
      </template>
    </div>
    <div v-if="isMetadata" class="options">
      <UiLabel accent="neutral">{{ t('options') }}</UiLabel>
      <BackupJobFormCheckbox v-bind="bindings.saveXoConfig" />
      <BackupJobFormCheckbox v-bind="bindings.savePoolsMetadata" />
    </div>
    <div v-if="!isMetadata || bindings.savePoolsMetadata.modelValue" class="scope">
      <BackupJobFormRadio v-bind="bindings.scopeType">
        <template v-if="!isMetadata" #info>
          <UiInfo wrap accent="info">{{ t('replications-excluded-from-selection') }}</UiInfo>
          <UiInfo v-if="isSourceBackupRepositoryMissing" wrap accent="danger">
            {{ t('select-source-backup-repository-first') }}
          </UiInfo>
        </template>
      </BackupJobFormRadio>
      <template v-if="hasVmSelection">
        <template v-if="bindings.scopeType.modelValue === 'manual'">
          <BackupJobSourceBackupVmTable
            v-if="isMirror"
            v-bind="bindings.vmIds"
            :vms="mirrorVms"
            :busy="!areMirrorVmsReady"
            :schema="mirrorVmSchema"
          />
          <BackupJobSourceVmTable v-else v-bind="bindings.vmIds" :vms />
        </template>
        <BackupJobFormDynamicSelection
          v-else-if="bindings.scopeType.modelValue === 'smart'"
          v-bind="bindings.vmFilter"
          :schema="vmSelectionSchema"
          :items="matchedSelectionItems"
          :count-label="t('n-vms', { n: matchedSelectionItems.length })"
        />
      </template>
      <template v-else-if="hasPoolSelection">
        <BackupJobSourcePoolTable
          v-if="bindings.scopeType.modelValue === 'manual'"
          v-bind="bindings.poolIds"
          :pools
          :schema="poolSchema"
        />
        <BackupJobFormDynamicSelection
          v-else-if="bindings.scopeType.modelValue === 'smart'"
          v-bind="bindings.poolFilter"
          :schema="poolSchema"
          :items="matchedPoolItems"
          :count-label="t('n-pools', { n: matchedPoolItems.length })"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormDynamicSelection from '@/modules/backup-job/components/form/inputs/BackupJobFormDynamicSelection.vue'
import BackupJobFormRadio from '@/modules/backup-job/components/form/inputs/BackupJobFormRadio.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import BackupJobFormTextInput from '@/modules/backup-job/components/form/inputs/BackupJobFormTextInput.vue'
import BackupJobSourceBackupVmTable from '@/modules/backup-job/components/form/source/BackupJobSourceBackupVmTable.vue'
import BackupJobSourcePoolTable from '@/modules/backup-job/components/form/source/BackupJobSourcePoolTable.vue'
import BackupJobSourceVmTable from '@/modules/backup-job/components/form/source/BackupJobSourceVmTable.vue'
import type { BackupJobSourceForm } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: BackupJobSourceForm
}>()

const { t } = useI18n()

const {
  bindings,
  vms,
  mirrorVms,
  areMirrorVmsReady,
  mirrorVmSchema,
  isMirror,
  isMetadata,
  hasVmSelection,
  vmSelectionSchema,
  matchedSelectionItems,
  pools,
  hasPoolSelection,
  poolSchema,
  matchedPoolItems,
} = form

const isSourceBackupRepositoryMissing = computed(
  () => isMirror.value && bindings.scopeType.modelValue !== 'all' && form.formData.sourceBackupRepository === undefined
)
</script>

<style lang="postcss" scoped>
.backup-job-source-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .mode {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .option-content {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }

  .scope {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }
}
</style>
