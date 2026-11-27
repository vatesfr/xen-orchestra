<template>
  <div class="vm-backup-archive-restore-live-step">
    <div class="section">
      <UiTitle>{{ t('where-to-run') }}</UiTitle>
      <BackupJobFormSelect v-bind="form.bindings.poolId">
        <template #option="{ option }">
          <VtsDetailedOption :option :details="form.getPoolDetails(option.source)" />
        </template>
      </BackupJobFormSelect>
      <BackupJobFormSelect v-bind="form.bindings.hostId" />
      <BackupJobFormSelect v-bind="form.bindings.cacheSrId">
        <template #option="{ option }">
          <VtsDetailedOption :option :details="form.getSrDetails(option.source)" />
        </template>
      </BackupJobFormSelect>
    </div>

    <div class="section">
      <UiTitle>
        {{ t('disks') }}
        <template #action>
          <span class="summary typo-body-regular-small">{{ form.disksSummary.value }}</span>
        </template>
      </UiTitle>
      <VmBackupArchiveRestoreDisksTable
        :rows="form.diskRows.value"
        :action-options="form.diskActionOptions.value"
        :srs="form.poolStorageRepositories.value"
        :default-sr-label="form.defaultSrLabel.value"
        :read-only-label
        :get-sr-details="form.getSrDetails"
        :error="form.bindings.disks.error"
        @select-action="(diskId, action) => form.setDiskAction(diskId, action)"
        @select-sr="(diskId, srId) => form.setDiskSr(diskId, srId)"
      />
      <UiAlert v-if="form.proxy.value !== undefined" accent="warning">
        {{ t('vm-depends-on-proxy', { vm: form.vmName.value, proxy: form.proxy.value.name }) }}
      </UiAlert>
    </div>

    <div class="section">
      <UiTitle>{{ t('options') }}</UiTitle>
      <BackupJobFormCheckbox v-bind="form.bindings.disconnectNetwork" />
      <BackupJobFormCheckbox v-bind="form.bindings.newMacAddresses" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreDisksTable from '@/modules/backup-archive/components/form/disks/VmBackupArchiveRestoreDisksTable.vue'
import type { RestoreVmBackupArchiveLiveForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-live-form.ts'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveLiveForm
}>()

const { t } = useI18n()

const readOnlyLabel = computed(() =>
  form.proxy.value === undefined
    ? t('from-the-backup')
    : t('from-the-backup-via-proxy', { proxy: form.proxy.value.name })
)
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-live-step {
  display: flex;
  flex-direction: column;
  gap: 4.8rem;
  margin-block-start: 2.4rem;
  text-align: left;

  .section {
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
  }

  .summary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
