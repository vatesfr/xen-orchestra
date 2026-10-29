<template>
  <div class="backup-job-form-snapshot-retention">
    <BackupJobFormRow>
      <div class="field">
        <UiLabel :accent="hasError ? 'danger' : 'neutral'" required>{{ label }}</UiLabel>
        <UiInput
          :model-value="model"
          :accent="hasError ? 'danger' : 'brand'"
          type="number"
          required
          @update:model-value="model = toNumber($event)"
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
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { toArray } from '@core/utils/to-array.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error } = defineProps<{
  label: string
  error?: InputWrapperMessage
}>()

const model = defineModel<number | undefined>({ required: true })

const { t } = useI18n()

const errorMessages = computed(() =>
  toArray(error).map(message => (typeof message === 'object' ? message.content : message))
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
.backup-job-form-snapshot-retention {
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  margin-block-start: 0.8rem;

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
