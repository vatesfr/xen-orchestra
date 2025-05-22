<template>
  <div :class="className" class="vts-select">
    <UiInput
      ref="triggerRef"
      :accent
      :disabled="isDisabled"
      :icon
      :model-value="selectedLabel"
      :placeholder
      :required="isRequired"
      readonly
      :right-icon="faAngleDown"
    />

    <Teleport v-if="isOpen" to="body">
      <VtsBackdrop />

      <UiDropdownList ref="dropdownRef" :style="floatingStyles" class="dropdown-list">
        <template v-if="isSearchable" #before>
          <div class="search-container">
            <UiInput
              ref="searchRef"
              v-model="searchTerm"
              :placeholder="searchPlaceholder"
              accent="brand"
              :right-icon="faMagnifyingGlass"
            />
          </div>
        </template>
        <UiDropdown v-if="isLoading || options.length === 0" accent="normal" disabled>
          {{ isLoading ? t('loading-in-progress') : t('no-results') }}
        </UiDropdown>
        <template v-for="option of options" :key="option.id">
          <slot :option="option as FormSelectIdToOption<TSelectId>">
            <VtsOption :option />
          </slot>
        </template>
      </UiDropdownList>
    </Teleport>
  </div>
</template>

<script generic="TSelectId extends FormSelectId" lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import {
  type FormSelect,
  type FormSelectId,
  type FormSelectIdToOption,
  useFormSelectController,
} from '@core/packages/form-select'
import { toVariants } from '@core/utils/to-variants.util.ts'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'
import { faAngleDown, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { useCurrentElement, useElementSize } from '@vueuse/core'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { accent, id } = defineProps<{
  accent: 'brand' | 'warning' | 'danger'
  id: TSelectId
  icon?: IconDefinition
}>()

defineSlots<{
  default(props: { option: FormSelectIdToOption<TSelectId> }): any
  before(): any
}>()

const { t } = useI18n()

const select = inject(id)

if (!select) {
  throw new Error(`No select configuration has been found for this ID`)
}

const {
  options,
  searchTerm,
  selectedLabel,
  isSearchable,
  isDisabled,
  isRequired,
  placeholder,
  searchPlaceholder,
  isLoading,
} = select as FormSelect

const { triggerRef, dropdownRef, searchRef, isOpen, floatingStyles } = useFormSelectController(select as FormSelect)

const className = computed(() => toVariants({ accent }))

const { width } = useElementSize(useCurrentElement())

const minWidth = computed(() => `${width.value}px`)
</script>

<style lang="postcss" scoped>
.vts-select {
  .ui-input:deep(input) {
    cursor: default;
  }
}

.dropdown-list {
  min-width: v-bind(minWidth);
  max-height: 36.2rem; /* 8 Dropdown items */
  overflow: auto;
  z-index: 1020;

  .search-container {
    background-color: var(--color-neutral-background-primary);
    padding: 0.4rem;
  }
}
</style>
