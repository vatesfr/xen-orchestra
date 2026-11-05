<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
    <VtsSelect :id accent="brand">
      <template #default="{ option }">
        <VtsOption :option>
          <span class="select-option">
            <VtsIcon v-if="option.properties.icon" :name="option.properties.icon" size="medium" />
            {{ option.properties.label }}
          </span>
        </VtsOption>
      </template>
    </VtsSelect>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { DropdownAccent } from '@core/components/ui/dropdown/UiDropdown.vue'
import type { IconName } from '@core/icons'
import type { FormSelectId } from '@core/packages/form-select'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { computed } from 'vue'

const { error, info } = defineProps<{
  id: FormSelectId<{ icon?: IconName; accent?: DropdownAccent }>
  label: string
  error?: InputWrapperMessage
  info?: InputWrapperMessage
}>()

const messages = computed(() => [error, info].filter(message => message !== undefined).flat())
</script>

<style lang="postcss" scoped>
.select-option {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
