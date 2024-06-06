<template>
  <FormInput :before="faCode" :model-value="jsonValue" readonly @click="openModal()" />
</template>

<script lang="ts" setup>
import FormInput from '@/components/form/FormInput.vue'
import { useModal } from '@/composables/modal.composable'
import { faCode } from '@fortawesome/free-solid-svg-icons'
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

const openModal = () => {
  const { onApprove } = useModal<string>(() => import('@/components/modals/JsonEditorModal.vue'), {
    initialValue: jsonValue.value,
  })

  onApprove(newValue => (model.value = JSON.parse(newValue)))
}
</script>
