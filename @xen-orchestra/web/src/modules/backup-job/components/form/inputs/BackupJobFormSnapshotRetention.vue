<template>
  <div class="backup-job-target-snapshot-retention-section">
    <UiTitle>{{ t('snapshot-retention') }}</UiTitle>

    <BackupJobFormRow>
      <div class="field">
        <UiLabel :accent="hasError ? 'danger' : 'neutral'" required>{{ bindings.snapshotRetention.label }}</UiLabel>
        <UiInput
          :model-value="bindings.snapshotRetention.modelValue"
          :accent="hasError ? 'danger' : 'brand'"
          type="number"
          required
          @update:model-value="bindings.snapshotRetention['onUpdate:modelValue'](toNumber($event))"
        />
      </div>
    </BackupJobFormRow>

    <div class="messages">
      <UiInfo accent="info" wrap>{{ t('value-by-default', { value: 1 }) }}</UiInfo>
      <div class="ephemeral typo-body-regular-small">
        <span>{{ t('ephemeral-snapshot-mode:title') }}</span>
        <ul>
          <li>{{ t('ephemeral-snapshot-mode:incremental') }}</li>
          <li>{{ t('ephemeral-snapshot-mode:full') }}</li>
        </ul>
      </div>
      <UiInfo v-for="message of errorMessages" :key="message" accent="danger" wrap>{{ message }}</UiInfo>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BackupJobFormRow from '@/modules/backup-job/components/form/BackupJobFormRow.vue'
import type { BackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { bindings } = defineProps<{
  bindings: BackupJobTargetForm['bindings']
}>()

const { t } = useI18n()

const errorMessages = computed(() =>
  toArray(bindings.snapshotRetention.error).map(message => (typeof message === 'object' ? message.content : message))
)

const hasError = computed(() => errorMessages.value.length > 0)

function toNumber(value: string | number | undefined): number | undefined {
  if (value === undefined || value === '') {
    return undefined
  }

  return Number(value)
}
</script>

<style lang="postcss" scoped>
.backup-job-target-snapshot-retention-section {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .messages {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin-block-start: -1.2rem;
  }

  .ephemeral {
    padding-inline-start: 2.4rem;
    color: var(--color-neutral-txt-secondary);

    ul {
      padding-inline-start: 2rem;
      list-style: disc;
    }
  }
}
</style>
