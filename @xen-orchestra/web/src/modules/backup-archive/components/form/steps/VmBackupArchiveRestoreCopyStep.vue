<template>
  <div class="vm-backup-archive-restore-copy-step">
    <div class="section">
      <UiTitle>{{ t('destination') }}</UiTitle>
      <BackupJobFormRow>
        <BackupJobFormSelect v-bind="form.bindings.poolId">
          <template #option="{ option }">
            <VtsDetailedOption :option :details="form.getPoolDetails(option.source)" />
          </template>
        </BackupJobFormSelect>
        <BackupJobFormSelect v-bind="form.bindings.defaultSrId">
          <template #option="{ option }">
            <VtsDetailedOption :option :details="form.getSrDetails(option.source)" />
          </template>
        </BackupJobFormSelect>
      </BackupJobFormRow>

      <div class="disks">
        <div class="disks-header">
          <UiSubtitle>{{ t('disks') }}</UiSubtitle>
          <span class="summary typo-body-regular-small">{{ form.disksSummary.value }}</span>
        </div>
        <UiAlert v-if="form.snapshotGroups.value.length > 0" accent="info">
          {{ t('snapshots-of-vm-found', { vm: form.vmName.value }) }}
          <template #description>
            <span v-for="group of form.snapshotGroups.value" :key="`${group.sr}:${group.date}`" class="group">
              {{ t('snapshots-found-description', group) }}
            </span>
          </template>
        </UiAlert>
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
        <UiAlert v-if="form.readOnlyDiskNames.value.length > 0 && form.proxy.value !== undefined" accent="info">
          {{ t('read-only-disks-stay-in-the-backup', { vm: form.vmName.value, proxy: form.proxy.value.name }) }}
        </UiAlert>
      </div>
    </div>

    <div class="section">
      <UiTitle>{{ t('options') }}</UiTitle>
      <BackupJobFormCheckbox v-bind="form.bindings.differentialRestore" />
      <BackupJobFormCheckbox v-bind="form.bindings.startVm" />
      <BackupJobFormCheckbox v-bind="form.bindings.disconnectNetwork" />
      <BackupJobFormCheckbox v-bind="form.bindings.newMacAddresses" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreDisksTable from '@/modules/backup-archive/components/form/disks/VmBackupArchiveRestoreDisksTable.vue'
import type { RestoreVmBackupArchiveCopyForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-copy-form.ts'
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import BackupJobFormCheckbox from '@/modules/backup-job/components/form/inputs/BackupJobFormCheckbox.vue'
import BackupJobFormSelect from '@/modules/backup-job/components/form/inputs/BackupJobFormSelect.vue'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiSubtitle from '@core/components/ui/subtitle/UiSubtitle.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveCopyForm
}>()

const { t } = useI18n()

const readOnlyLabel = computed(() =>
  form.proxy.value === undefined
    ? t('from-the-backup')
    : t('from-the-backup-via-proxy', { proxy: form.proxy.value.name })
)
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-copy-step {
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

  .disks {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .disks-header {
    display: flex;
    align-items: center;
    gap: 2.4rem;

    .summary {
      margin-inline-start: auto;
      color: var(--color-neutral-txt-secondary);
    }
  }

  .group {
    display: block;
  }
}
</style>
