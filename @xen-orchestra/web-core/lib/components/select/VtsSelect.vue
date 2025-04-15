<template>
  <div :class="toVariants({ accent })" class="vts-select">
    <VtsBackdrop v-if="isOpen" />

    <UiInput
      ref="triggerRef"
      :accent
      :model-value="selectedLabel"
      :placeholder
      :required
      :right-icon="faAngleDown"
      readonly
    />

    <UiDropdownList v-if="isOpen" ref="dropdownRef" :style="floatingStyles" class="dropdown-list">
      <template v-if="searchTerm !== undefined" #before>
        <div class="search-container">
          <UiInput
            ref="searchRef"
            v-model="searchTerm"
            :placeholder="searchPlaceholder"
            :right-icon="faMagnifyingGlass"
            accent="brand"
          />
        </div>
      </template>
      <UiDropdown v-if="loading || options.length === 0" accent="normal" disabled>
        {{ loading ? t('loading-in-progress') : t('no-results') }}
      </UiDropdown>
      <slot>
        <VtsOption v-for="option of options" :key="option.id" :option />
      </slot>
    </UiDropdownList>
  </div>
</template>

<script generic="TOption extends FormOption<unknown, PropertyKey>" lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import type { FormOption } from '@core/packages/form-select/type.ts'
import { useFormSelect } from '@core/packages/form-select/use-form-select.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { faAngleDown, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const {
  accent,
  options,
  selectedLabel: _selectedLabel,
} = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  options: TOption[]
  selectedLabel?: string
  required?: boolean
  placeholder?: string
  searchPlaceholder?: string
  loading?: boolean
}>()

const searchTerm = defineModel<string>('search')

defineSlots<{
  default(): any
}>()

const { t } = useI18n()

const { triggerRef, dropdownRef, searchRef, isOpen, floatingStyles } = useFormSelect({
  options: () => options,
  searchTerm,
})

const selectedLabel = computed(
  () => _selectedLabel ?? options.flatMap(option => (option.flags.selected ? option.properties.label : [])).join(', ')
)
</script>

<style lang="postcss" scoped>
.vts-select {
  .ui-input:deep(input) {
    cursor: default;
  }

  .dropdown-list {
    min-width: 40rem;
    max-height: 362px; /* 8 Dropdown items */
    overflow: auto;
    z-index: 1020;

    .search-container {
      background-color: var(--color-neutral-background-primary);
      padding: 0.4rem;
    }
  }
}
</style>
