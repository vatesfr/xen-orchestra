<template>
  <div class="vts-query-builder-filter">
    <VtsSelect :id="propertySelectId" ref="propertySelector" accent="brand" />
    <VtsSelect :id="operatorSelectId" accent="brand" />
    <UiInput v-if="valueType === 'input'" v-model="value" class="value" accent="brand" />
    <VtsSelect v-else-if="valueType === 'select'" :id="valueSelectId" class="value" accent="brand" />
    <div>
      <MenuList :placement="uiStore.isSmall ? 'bottom' : 'bottom-end'">
        <template #trigger="{ open }">
          <UiButton
            v-if="uiStore.isSmall"
            class="actions-button"
            variant="secondary"
            icon="fa:ellipsis"
            size="medium"
            accent="brand"
            @click="open"
          >
            {{ t('filter-actions') }}
          </UiButton>
          <UiButtonIcon v-else icon="fa:ellipsis" size="medium" accent="brand" @click="open" />
        </template>
        <MenuItem icon="fa:clone" @click="emit('duplicate')">{{ t('action:duplicate') }}</MenuItem>
        <MenuItem icon="fa:layer-group" @click="emit('convertToGroup')">{{ t('action:turn-into-group') }}</MenuItem>
        <MenuItem icon="fa:trash" @click="emit('remove')">{{ t('action:delete-filter') }}</MenuItem>
      </MenuList>
    </div>
  </div>
</template>

<script lang="ts" setup>
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useFormSelect } from '@core/packages/form-select'
import type { PropertySchema, OperatorSchema, ValueSchema } from '@core/packages/query-builder/types'
import { useUiStore } from '@core/stores/ui.store.ts'
import { onMounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

const { properties, operators, values, valueType } = defineProps<{
  properties: PropertySchema[]
  operators: OperatorSchema[]
  values: ValueSchema[]
  valueType: 'input' | 'select' | 'none'
}>()

const emit = defineEmits<{
  remove: []
  duplicate: []
  convertToGroup: []
}>()

const property = defineModel<string | undefined>('property', { required: true })

const operator = defineModel<string | undefined>('operator', { required: true })

const value = defineModel<string | undefined>('value', { required: true })

const { t } = useI18n()

const uiStore = useUiStore()

const propertySelector = useTemplateRef('propertySelector')

const { id: propertySelectId } = useFormSelect(() => properties, {
  model: property,
  option: {
    id: 'property',
    value: 'property',
  },
})

const { id: operatorSelectId } = useFormSelect(() => operators, {
  model: operator,
  option: {
    id: 'operator',
    value: 'operator',
  },
})

const { id: valueSelectId } = useFormSelect(() => values, {
  model: value,
  option: {
    id: 'value',
    value: 'value',
  },
})

onMounted(() => propertySelector.value?.focus())
</script>

<style lang="postcss" scoped>
.vts-query-builder-filter {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  background-color: #00000010;
  padding: 0.3rem;
  margin-inline-end: 0.5rem;
  max-width: 100%;
  overflow: auto;
  border-radius: 0.3rem;

  @media (--small) {
    flex-direction: column;
    align-items: stretch;
  }

  .label {
    white-space: nowrap;
    margin-inline-end: 1rem;
  }

  .value {
    flex: 1;
  }

  .actions-button {
    width: 100%;
  }
}
</style>
