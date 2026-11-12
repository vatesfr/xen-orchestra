<template>
  <UiDropdown
    ref="elementRef"
    v-tooltip="option.properties.lock ?? false"
    :accent="option.properties.isNew ? 'brand' : 'normal'"
    :busy="option.properties.busy"
    :checkbox="!option.properties.isNew"
    :disabled="option.properties.disabled"
    :hover="option.flags.active"
    :icon="option.properties.isNew ? 'action:add' : undefined"
    :info="option.properties.info"
    :selected="option.flags.selected"
    class="vts-tag-select-option"
  >
    <span class="option-content">
      <template v-if="option.properties.isNew">{{ t('action:create') }}</template>
      <VtsTag :accent="option.properties.tagAccent" :value="option.properties.label" />
    </span>
  </UiDropdown>
</template>

<script
  generic="
    TOption extends FormOption<{
      isNew: boolean
      info: string | undefined
      tagAccent: TagAccent
      lock: string | undefined
      busy: boolean
    }>
  "
  lang="ts"
  setup
>
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
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
  .option-content {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
