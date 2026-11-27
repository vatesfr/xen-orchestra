<template>
  <BackupJobReviewSection :title="t('copy-then-start')" @edit="emit('edit')">
    <UiSubtitle>{{ t('destination') }}</UiSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('pool')" :value="form.selectedPool.value?.name_label" />
      <VtsTabularKeyValueRow :label="t('default-storage')" :value="form.selectedDefaultSr.value?.name_label" />
    </VtsTabularKeyValueList>

    <UiSubtitle>{{ t('disks') }}</UiSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow v-for="disk of form.diskSummaries.value" :key="disk.id" :label="disk.name">
        <template #value>
          <span class="disk-value">
            {{ disk.label }}
            <span v-if="disk.size !== undefined" class="size">{{ t('dot-prefix', { value: disk.size }) }}</span>
          </span>
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
    <UiAlert v-if="form.readOnlyDiskNames.value.length > 0 && form.proxy.value !== undefined" accent="info">
      {{
        t('vm-needs-proxy-while-using-disks', {
          vm: form.vmName.value,
          proxy: form.proxy.value.name,
          disks: form.readOnlyDiskNames.value.join(', '),
        })
      }}
    </UiAlert>

    <UiSubtitle>{{ t('options') }}</UiSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('differential-restore-when-possible')">
        <template #value>
          <VtsStatus :status="form.formData.differentialRestore" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('start-the-vm-after-restore')">
        <template #value>
          <VtsStatus :status="form.formData.startVm" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('start-with-network-disconnected')">
        <template #value>
          <VtsStatus :status="form.formData.disconnectNetwork" />
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('generate-new-mac-addresses')">
        <template #value>
          <VtsStatus :status="form.formData.newMacAddresses" />
        </template>
      </VtsTabularKeyValueRow>
    </VtsTabularKeyValueList>
  </BackupJobReviewSection>
</template>

<script lang="ts" setup>
import type { RestoreVmBackupArchiveCopyForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-copy-form.ts'
import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiSubtitle from '@core/components/ui/subtitle/UiSubtitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  form: RestoreVmBackupArchiveCopyForm
}>()

const emit = defineEmits<{
  edit: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.disk-value {
  .size {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
