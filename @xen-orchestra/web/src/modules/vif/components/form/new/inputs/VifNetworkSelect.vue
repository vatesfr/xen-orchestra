<template>
  <VtsInputWrapper :label="t('network')" :message="error">
    <VtsSelect :id accent="brand">
      <template #default="{ option }">
        <VtsOption :option>
          <span class="select-option">
            <VtsIcon name="object:network" size="medium" />
            {{ option.properties.label }}
          </span>
        </VtsOption>
      </template>
    </VtsSelect>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { FormSelectId } from '@core/packages/form-select'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  id: FormSelectId
  error?: InputWrapperMessage
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
