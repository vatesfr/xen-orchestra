<template>
  <BackupJobReviewSection :title="t('start-now')" @edit="emit('edit')">
    <UiSubtitle>{{ t('where-to-run') }}</UiSubtitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('pool')" :value="form.selectedPool.value?.name_label" />
      <VtsTabularKeyValueRow :label="t('host')" :value="form.selectedHost.value?.name_label" />
      <VtsTabularKeyValueRow :label="t('cache-storage')" :value="form.selectedCacheSr.value?.name_label" />
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
    <UiAlert v-if="form.proxy.value !== undefined" accent="warning">
      {{ t('vm-depends-on-proxy', { vm: form.vmName.value, proxy: form.proxy.value.name }) }}
    </UiAlert>

    <UiSubtitle>{{ t('options') }}</UiSubtitle>
    <VtsTabularKeyValueList>
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
import type { RestoreVmBackupArchiveLiveForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-live-form.ts'
import BackupJobReviewSection from '@/modules/backup-job/components/form/review/BackupJobReviewSection.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiSubtitle from '@core/components/ui/subtitle/UiSubtitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  form: RestoreVmBackupArchiveLiveForm
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
