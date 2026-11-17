<template>
  <VtsSelect :id accent="brand" />
</template>

<script lang="ts" setup>
import { useV2vLaunchOptionSelect } from '@/modules/v2v/composables/use-v2v-launch-option-select.composable.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'

const { defaultValue } = defineProps<{
  defaultValue: boolean
}>()

// `undefined` follows the default value
const model = defineModel<boolean | undefined>()

const { id } = useV2vLaunchOptionSelect(model, () => defaultValue)
</script>
