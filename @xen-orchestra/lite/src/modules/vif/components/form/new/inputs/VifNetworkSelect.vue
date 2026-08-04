<template>
  <VtsInputWrapper :label="t('network')" :message="error">
    <VtsSelect :id accent="brand">
      <template v-if="slots.option" #default="slotProps">
        <slot name="option" v-bind="slotProps" />
      </template>
    </VtsSelect>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { IconName } from '@core/icons'
import type { FormOption, FormSelectId } from '@core/packages/form-select'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useI18n } from 'vue-i18n'

export type VifNetworkSelectOption = FormOption<{ icon?: IconName }>

defineProps<{
  id: FormSelectId
  error?: InputWrapperMessage
}>()

const slots = defineSlots<{
  option?(props: { option: VifNetworkSelectOption }): any
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.select-option {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
