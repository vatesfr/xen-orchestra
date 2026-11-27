<template>
  <UiRichRadioButtonGroup :accent vertical :message="errorMessage">
    <template #label>
      <UiLabel accent="neutral" required>{{ label }}</UiLabel>
    </template>
    <UiRichRadioButton
      v-for="option of options"
      :key="option.value"
      v-model="model"
      :accent
      :value="option.value"
      :icon="option.icon"
      :description="option.description"
    >
      {{ option.label }}
    </UiRichRadioButton>
  </UiRichRadioButtonGroup>
</template>

<script lang="ts" setup generic="TValue extends string">
import type { VmBackupArchiveRestoreRadioOption } from '@/modules/backup-archive/form/restore/use-restore-vm-backup-archive-source.ts'
import { formatErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import UiRichRadioButton from '@core/components/ui/rich-radio-button/UiRichRadioButton.vue'
import UiRichRadioButtonGroup from '@core/components/ui/rich-radio-button-group/UiRichRadioButtonGroup.vue'
import { computed } from 'vue'

const { error } = defineProps<{
  label: string
  options: VmBackupArchiveRestoreRadioOption<TValue>[]
  error?: InputWrapperMessage
}>()

const model = defineModel<TValue | undefined>({ required: true })

const errorMessage = computed(() => formatErrorMessage(error))

const accent = computed(() => (errorMessage.value === undefined ? 'brand' : 'danger'))
</script>
