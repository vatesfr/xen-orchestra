<template>
  <FormInputGroup>
    <FormNumber v-model="sizeInput" :max-decimals="3" />
    <FormSelect v-model="prefixInput">
      <option value="Ki">{{ t('bytes.ki') }}</option>
      <option value="Mi">{{ t('bytes.mi') }}</option>
      <option value="Gi">{{ t('bytes.gi') }}</option>
    </FormSelect>
  </FormInputGroup>
</template>

<script lang="ts" setup>
import FormInputGroup from '@/components/form/FormInputGroup.vue'
import FormNumber from '@/components/form/FormNumber.vue'
import FormSelect from '@/components/form/FormSelect.vue'
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
