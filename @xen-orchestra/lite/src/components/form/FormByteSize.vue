<template>
  <VtsInputGroup>
    <UiInput v-model.number="sizeInput" accent="brand" type="number" :max-decimals="3" />
    <VtsSelect :id="prefixSelectId" accent="brand" />
  </VtsInputGroup>
</template>

<script lang="ts" setup>
import VtsInputGroup from '@core/components/input-group/VtsInputGroup.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import UiInput from '@core/components/ui/input/UiInput.vue'
import { useFormSelect } from '@core/packages/form-select'
import { useVModel } from '@vueuse/core'
import format, { type Prefix } from 'human-format'
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: number | undefined
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const { t } = useI18n()

const availablePrefixes: Prefix<'binary'>[] = ['Ki', 'Mi', 'Gi']

const model = useVModel(props, 'modelValue', emit, {
  shouldEmit: value => value !== props.modelValue,
})

const sizeInput = ref()
const prefixInput = ref()

const scale = format.Scale.create(availablePrefixes, 1024, 1)

const { id: prefixSelectId } = useFormSelect(
  [
    { value: 'Ki', label: t('bytes:ki') },
    { value: 'Mi', label: t('bytes:mi') },
    { value: 'Gi', label: t('bytes:gi') },
  ],
  {
    model: prefixInput,
    option: {
      id: 'value',
      value: 'value',
      label: 'label',
    },
  }
)

watch([sizeInput, prefixInput], ([newSize, newPrefix]) => {
  if (newSize === '' || newSize === undefined) {
    return
  }

  model.value = format.parse(`${newSize || 0} ${newPrefix || 'Ki'}`, {
    scale,
  })
})

watch(
  () => props.modelValue,
  newValue => {
    if (newValue === undefined) {
      sizeInput.value = undefined

      if (prefixInput.value === undefined) {
        prefixInput.value = availablePrefixes[0]
      }

      return
    }

    const { value, prefix } = format.raw(newValue, {
      scale,
      prefix: prefixInput.value,
    })

    sizeInput.value = value

    if (value !== 0) {
      prefixInput.value = prefix
    }
  },
  { immediate: true }
)
</script>
