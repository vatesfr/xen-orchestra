<template>
  <div class="vm-backup-archive-restore-attach-disk-step">
    <div class="sections">
      <section class="section">
        <UiTitle>{{ t('disk') }}</UiTitle>
        <VmBackupArchiveRestoreRichRadioGroup v-bind="form.bindings.disk" />
        <UiInfo accent="info" wrap>{{ t('the-disk-is-served-read-only-from-the-backup') }}</UiInfo>
      </section>

      <section class="section">
        <UiTitle>{{ t('target-vm') }}</UiTitle>
        <VmBackupArchiveRestoreFormSelect v-bind="form.bindings.vm">
          <template #option="{ option }">
            <VtsDetailedOption :option :details="option.properties.poolName" />
          </template>
        </VmBackupArchiveRestoreFormSelect>
        <VtsTabularKeyValueList>
          <VtsTabularKeyValueRow :label="t('served-to')">
            <template #value>
              <span v-if="selectedVm !== undefined && vmHost !== undefined" class="value">
                <VtsIcon name="object:host" size="medium" />
                {{ vmHost.name_label }}
                <span class="typo-body-regular-small suffix">
                  {{ t('dot-prefix', { value: t('where-vm-runs', { vm: selectedVm.name_label }) }) }}
                </span>
              </span>
              <template v-else>{{ t('the-host-where-the-chosen-vm-runs') }}</template>
            </template>
          </VtsTabularKeyValueRow>
          <VtsTabularKeyValueRow :label="t('attached-as')">
            <template #value>
              {{ t('next-free-device-read-only') }}
              <span v-if="nextFreeDevice !== undefined" class="typo-body-regular-small suffix">
                {{ t('dot-prefix', { value: nextFreeDevice }) }}
              </span>
            </template>
          </VtsTabularKeyValueRow>
        </VtsTabularKeyValueList>
      </section>

      <UiAlert accent="warning">
        {{ t('while-the-disk-is-attached') }}
        <template #description>
          <p v-if="selectedVm !== undefined && vmHost !== undefined">
            {{ t('vm-cannot-be-migrated-off-host', { vm: selectedVm.name_label, host: vmHost.name_label }) }}
          </p>
          <p v-else>{{ t('the-vm-cannot-be-migrated-off-its-host') }}</p>
          <p v-if="proxyName !== undefined">
            <I18nT keypath="the-disk-depends-on-proxy" scope="global">
              <template #proxy>
                <strong>{{ proxyName }}</strong>
              </template>
            </I18nT>
          </p>
          <p v-if="selectedVm !== undefined">{{ t('detach-it-from-vm-page', { vm: selectedVm.name_label }) }}</p>
          <p v-else>{{ t('detach-it-from-the-vm-page') }}</p>
        </template>
      </UiAlert>
    </div>
  </div>
</template>

<script lang="ts" setup>
import VmBackupArchiveRestoreFormSelect from '@/modules/backup-archive/components/form/inputs/VmBackupArchiveRestoreFormSelect.vue'
import VmBackupArchiveRestoreRichRadioGroup from '@/modules/backup-archive/components/form/inputs/VmBackupArchiveRestoreRichRadioGroup.vue'
import type { RestoreVmBackupArchiveAttachDiskForm } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-attach-disk-form.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsDetailedOption from '@core/components/select/VtsDetailedOption.vue'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { I18nT, useI18n } from 'vue-i18n'

const { form } = defineProps<{
  form: RestoreVmBackupArchiveAttachDiskForm
}>()

const { t } = useI18n()

const { selectedVm, vmHost, nextFreeDevice, proxyName } = form
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-attach-disk-step {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  text-align: left;

  .sections {
    display: flex;
    flex-direction: column;
    gap: 4.8rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
  }

  .suffix {
    color: var(--color-neutral-txt-secondary);
  }

  .value {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
