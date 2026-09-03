<template>
  <VtsInputWrapper :label :message="error" :learn-more-url="learnMoreUrl">
    <VtsSelect :id accent="brand">
      <template v-if="slots.option" #default="slotProps">
        <slot name="option" v-bind="slotProps" />
      </template>
    </VtsSelect>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@xen-orchestra/web-core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormOption, FormSelectId } from '@xen-orchestra/web-core/packages/form-select'
import VtsInputWrapper from '@xen-orchestra/web-core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@xen-orchestra/web-core/components/select/VtsSelect.vue'

export type BackupRepositoryFormSelectOption = FormOption<{ hint?: string }>

defineProps<{
  id: FormSelectId
  label: string
  error?: InputWrapperMessage
  learnMoreUrl?: string
}>()

const slots = defineSlots<{
  option?(props: { option: BackupRepositoryFormSelectOption }): any
}>()
</script>
