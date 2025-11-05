<template>
  <FormInput before="fa:code" :model-value="jsonValue" readonly @click="openJsonModal()" />
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { useVModel } from '@vueuse/core'
import { computed } from 'vue'

const props = defineProps<{
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const model = useVModel(props, 'modelValue', emit)

const jsonValue = computed(() => JSON.stringify(model.value, undefined, 2))

const openJsonModal = useModal({
  component: import('@/components/modals/JsonEditorModal.vue'),
  props: { initialValue: computed(() => jsonValue.value) },
  onConfirm: newValue => {
    model.value = JSON.parse(newValue)
  },
})
</script>
