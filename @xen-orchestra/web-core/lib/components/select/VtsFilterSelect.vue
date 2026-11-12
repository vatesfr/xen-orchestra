<template>
  <div ref="rootRef" class="vts-filter-select">
    <UiDropdownButton ref="triggerRef" :disabled="isDisabled" :icon :selected="isOpen" size="small" variant="primary">
      <slot />
    </UiDropdownButton>

    <template v-if="isOpen">
      <VtsBackdrop />

      <UiDropdownList ref="dropdownRef" :style="floatingStyles" class="dropdown-list">
        <template #before>
          <div class="select-all-buttons">
            <UiButton accent="brand" size="small" variant="tertiary" @click="toggleSelectAll(true)">
              {{ t('action:select-all') }}
            </UiButton>
            <UiButton accent="brand" size="small" variant="tertiary" @click="toggleSelectAll(false)">
              {{ t('action:deselect-all') }}
            </UiButton>
          </div>
        </template>
        <template v-for="option of options" :key="option.id">
          <slot name="option" :option="option as FormSelectIdToOption<TSelectId>">
            <VtsOption :option />
          </slot>
        </template>
      </UiDropdownList>
    </template>
  </div>
</template>

<script generic="TSelectId extends FormSelectId" lang="ts" setup>
import VtsBackdrop from '@core/components/backdrop/VtsBackdrop.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiDropdownList from '@core/components/ui/dropdown/UiDropdownList.vue'
import UiDropdownButton from '@core/components/ui/dropdown-button/UiDropdownButton.vue'
import type { IconName } from '@core/icons'
import {
  type FormSelect,
  type FormSelectId,
  type FormSelectIdToOption,
  useFormSelectController,
} from '@core/packages/form-select'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { id } = defineProps<{
  id: TSelectId
  icon?: IconName
}>()

defineSlots<{
  default(): any
  option?(props: { option: FormSelectIdToOption<TSelectId> }): any
}>()

const { t } = useI18n()

const select = inject(id)

if (!select) {
  throw new Error(`No select configuration has been found for this ID`)
}

const { options, isDisabled } = select as FormSelect

const { rootRef, triggerRef, dropdownRef, isOpen, floatingStyles } = useFormSelectController(select as FormSelect)

function toggleSelectAll(value: boolean) {
  options.value.filter(option => !option.properties.disabled).forEach(option => option.toggleFlag('selected', value))
}
</script>

<style lang="postcss" scoped>
.vts-filter-select {
  display: inline-block;
}

.dropdown-list {
  max-height: 36.2rem; /* 8 Dropdown items */
  overflow: auto;
  z-index: 1020;

  .select-all-buttons {
    display: flex;
    gap: 0.8rem;
    padding: 0.4rem;
    background: var(--color-neutral-background-secondary);
  }
}
</style>
