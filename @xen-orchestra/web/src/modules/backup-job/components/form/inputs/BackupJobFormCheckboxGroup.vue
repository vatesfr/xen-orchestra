<template>
  <UiCheckboxGroup :accent :vertical="uiStore.isSmall">
    <template #label>
      <UiLabel :accent="labelAccent" required>{{ label }}</UiLabel>
    </template>
    <UiCheckbox v-for="option of options" :key="option.value" v-model="model" :accent :value="option.value">
      {{ option.label }}
    </UiCheckbox>
    <template v-if="errorMessage !== undefined" #info>
      <UiInfo accent="danger" wrap>
        {{ errorMessage }}
      </UiInfo>
    </template>
  </UiCheckboxGroup>
</template>

<script setup lang="ts" generic="TValue extends string">
import { toErrorMessage } from '@/modules/backup-job/utils/backup-job-error-message.util.ts'
import type { BackupJobFormOption } from '@/modules/backup-job/utils/backup-job-form.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import UiCheckbox from '@core/components/ui/checkbox/UiCheckbox.vue'
import UiCheckboxGroup from '@core/components/ui/checkbox-group/UiCheckboxGroup.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiLabel from '@core/components/ui/label/UiLabel.vue'
import { useUiStore } from '@core/stores/ui.store.ts'
import { computed } from 'vue'

const { error } = defineProps<{
  label: string
  options: BackupJobFormOption<TValue>[]
  error?: InputWrapperMessage
}>()

const model = defineModel<TValue[]>({ required: true })

const uiStore = useUiStore()

const errorMessage = computed(() => toErrorMessage(error))

const accent = computed(() => (errorMessage.value !== undefined ? 'danger' : 'brand'))

const labelAccent = computed(() => (errorMessage.value !== undefined ? 'danger' : 'neutral'))
</script>
