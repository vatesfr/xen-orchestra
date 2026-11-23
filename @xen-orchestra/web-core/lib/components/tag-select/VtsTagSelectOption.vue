<template>
  <UiDropdown
    ref="elementRef"
    :accent="option.properties.isNew ? 'brand' : 'normal'"
    :checkbox="!option.properties.isNew"
    :hover="option.flags.active"
    :icon="option.properties.isNew ? 'action:add' : undefined"
    :info="option.properties.info"
    :selected="option.flags.selected"
    class="vts-tag-select-option"
    tabindex="-1"
    @focus="option.toggleFlag('active', true)"
  >
    <span class="option-content">
      <template v-if="option.properties.isNew">{{ t('action:create') }}</template>
      <VtsTag :value="option.properties.label" accent="brand" />
    </span>
  </UiDropdown>
</template>

<script generic="TOption extends FormOption<TagOptionProperties>" lang="ts" setup>
import VtsTag from '@core/components/tag/VtsTag.vue'
import type { TagOptionProperties } from '@core/components/tag-select/VtsTagSelect.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import { type FormOption, useFormOptionController } from '@core/packages/form-select'
import { useI18n } from 'vue-i18n'

const { option } = defineProps<{
  option: TOption
}>()

const { t } = useI18n()

const { elementRef } = useFormOptionController(() => option)
</script>

<style lang="postcss" scoped>
.vts-tag-select-option {
  &.ui-dropdown.selected:not(:hover, .hover, :active, .disabled) {
    background-color: var(--color-neutral-background-primary);
  }

  &:focus-visible {
    outline: 0.1rem solid var(--color-brand-txt-base);
    outline-offset: -0.1rem;
  }

  .option-content {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
