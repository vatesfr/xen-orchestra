<template>
  <div ref="rootRef" :class="className" class="vts-select">
    <UiInput
      ref="triggerRef"
      :accent
      :disabled="isDisabled"
      :model-value="selectedLabel"
      :placeholder
      :required="isRequired"
      readonly
    >
      <template #right-icon>
        <VtsIcon v-if="isSuccessIconVisible" name="status:success-circle" size="medium" />
        <VtsIcon name="fa:angle-down" size="medium" class="right-icon" />
      </template>
    </UiInput>

    <template v-if="isOpen">
      <VtsBackdrop />

      <UiDropdownList ref="dropdownRef" :style="floatingStyles" class="dropdown-list">
        <template v-if="isSearchable" #before>
          <div class="search-container">
            <UiInput
              ref="searchRef"
              v-model="searchTerm"
              :placeholder="searchPlaceholder"
              right-icon="fa:magnifying-glass"
              accent="neutral"
              detached
            />
          </div>
        </template>
        <UiDropdown v-if="isLoading || options.length === 0" accent="normal" disabled>
          {{ isLoading ? t('loading') : t('no-result') }}
        </UiDropdown>
        <template v-for="option of options" :key="option.id">
          <slot :option="option as FormSelectIdToOption<TSelectId>">
            <VtsOption :option />
          </slot>
        </template>
      </UiDropdownList>
    </template>
  </div>
</template>

<script generic="TSelectId extends FormSelectId" lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiDropdown from '@core/components/ui/dropdown/UiDropdown.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import UiInput, { type InputAccent } from '@core/components/ui/input/UiInput.vue'
import {
  INPUT_WRAPPER_ACCENTS,
  useInputWrapperController,
} from '@core/composables/input-wrapper-controller.composable.ts'
import {
  type FormSelect,
  type FormSelectId,
  type FormSelectIdToOption,
  useFormSelectController,
} from '@core/packages/form-select'
import { toVariants } from '@core/utils/to-variants.util.ts'
import { useElementSize } from '@vueuse/core'
import { computed, inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { accent, id } = defineProps<{
  accent: InputAccent
  id: TSelectId
}>()

defineSlots<{
  default?(props: { option: FormSelectIdToOption<TSelectId> }): any
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

const { rootRef, triggerRef, dropdownRef, searchRef, isOpen, floatingStyles } = useFormSelectController(
  select as FormSelect
)

const className = computed(() => toVariants({ accent }))

// The trigger is a readonly input, which hides its own success icon: the select shows it instead
const { accent: resolvedAccent } = useInputWrapperController({
  accent: () => accent,
  accents: INPUT_WRAPPER_ACCENTS,
})

const isSuccessIconVisible = computed(() => resolvedAccent.value === 'success' && !isDisabled.value)

const { width } = useElementSize(rootRef)

const minWidth = computed(() => `${width.value}px`)

defineExpose({
  focus: () => triggerRef.value?.focus(),
})
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

    .ui-input:deep(input) {
      width: 0;
    }
  }
}
</style>
