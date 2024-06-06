<template>
  <FormInput v-model="localValue" inputmode="decimal" />
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  modelValue: number | undefined
  maxDecimals?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const localValue = ref('')

const hasTrailingDot = ref(false)

const cleaningRegex = computed(() => {
  if (props.maxDecimals === undefined) {
    // Any number with optional decimal part
    return /(\d*\.?\d*)/
  }

  if (props.maxDecimals > 0) {
    // Numbers with up to `props.maxDecimals` decimal places
    return new RegExp(`(\\d*\\.?\\d{0,${props.maxDecimals}})`)
  }

  // Integer numbers only
  return /(\d*)/
})

watch(
  localValue,
  newLocalValue => {
    const cleanValue =
      localValue.value
        .replace(',', '.')
        .replace(/[^0-9.]/g, '')
        .match(cleaningRegex.value)?.[0] ?? ''

    hasTrailingDot.value = cleanValue.endsWith('.')

    if (cleanValue !== newLocalValue) {
      localValue.value = cleanValue
      return
    }

    if (newLocalValue === '') {
      emit('update:modelValue', undefined)
      return
    }

    const parsedValue = parseFloat(cleanValue)

    emit('update:modelValue', Number.isNaN(parsedValue) ? undefined : parsedValue)
  },
  { flush: 'post' }
)

watch(
  () => props.modelValue,
  newModelValue => {
    localValue.value = `${newModelValue?.toString() ?? ''}${hasTrailingDot.value ? '.' : ''}`
  },
  { immediate: true }
)
</script>
