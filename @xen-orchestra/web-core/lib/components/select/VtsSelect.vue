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
      <template v-if="searchable" #before>
        <div class="search-container">
          <UiInput
            ref="searchRef"
            v-model="searchTerm"
            :placeholder="$t('core.search')"
            :right-icon="faMagnifyingGlass"
            accent="brand"
          />
        </div>
      </template>
      <UiDropdown v-if="loading || filteredOptions.length === 0" accent="normal" disabled>
        {{ loading ? $t('loading-in-progress') : $t('no-results') }}
      </UiDropdown>
      <VtsOption
        v-for="option of filteredOptions"
        :key="option.value"
        :checkbox="multiple"
        :disabled="option.disabled"
        :value="option.value"
      >
        <slot :option>{{ option.label ?? option.value }}</slot>
      </VtsOption>
    </UiDropdownList>
  </div>
</template>

<script generic="TData" lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { type FormOption, type FormOptionValue } from '@core/packages/form-select/form-select.type'
import { useFormSelect } from '@core/packages/form-select/use-form-select.ts'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { faAngleDown, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { whenever } from '@vueuse/core'

const {
  accent,
  options: rawOptions,
  multiple,
  showMax,
  searchable,
} = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  options: FormOption<TData>[]
  searchable?: boolean
  required?: boolean
  multiple?: boolean
  placeholder?: string
  loading?: boolean
  showMax?: number
}>()

const model = defineModel<FormOptionValue[]>({ required: true })

defineSlots<{
  default(props: { option: FormOption<TData> }): any
}>()

const { triggerRef, dropdownRef, searchRef, isOpen, filteredOptions, searchTerm, selectedLabel, floatingStyles } =
  useFormSelect(
    model,
    () => rawOptions,
    () => ({
      multiple,
      showMax,
    })
  )

whenever(
  () => !searchable,
  () => {
    searchTerm.value = ''
  }
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
