<template>
  <NewSrFormSelect v-bind="props">
    <template #option="{ option }">
      <VtsDropdownTitle
        v-if="option.properties.isFirstInGroup && option.properties.group"
        :icon="option.properties.icon"
      >
        {{ t(GROUP_LABEL_KEYS[option.properties.group]) }}
      </VtsDropdownTitle>
      <VtsOption :option />
    </template>
  </NewSrFormSelect>
</template>

<script lang="ts" setup>
import NewSrFormSelect from '@/modules/storage-repository/components/form/new/inputs/NewSrFormSelect.vue'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  id: FormSelectId
  label: string
  required?: boolean
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
}>()

const GROUP_LABEL_KEYS = {
  vdi: 'sr-group-vdi',
  iso: 'sr-group-iso',
} as const

const { t } = useI18n()
</script>
