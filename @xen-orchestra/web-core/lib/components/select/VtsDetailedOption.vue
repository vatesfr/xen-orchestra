<template>
  <VtsOption :option>
    <span class="vts-detailed-option">
      <VtsIcon v-if="icon" :name="icon" :tooltip="iconTooltip" size="medium" />
      {{ option.properties.label }}
      <span v-if="details" class="em-dash-prefix typo-body-regular-small">{{ details }}</span>
    </span>
  </VtsOption>
</template>

<script lang="ts" setup>
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import type { DropdownAccent } from '@core/components/ui/dropdown/UiDropdown.vue'
import type { IconName } from '@core/icons'
import type { FormOption } from '@core/packages/form-select/types.ts'

defineProps<{
  option: FormOption<{ accent?: DropdownAccent }>
  icon?: IconName
  iconTooltip?: string
  details?: string
}>()
</script>

<style lang="postcss" scoped>
.vts-detailed-option {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
}
</style>
