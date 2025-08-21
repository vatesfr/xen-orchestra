<template>
  <VtsSelect :id accent="brand" />
</template>

<script lang="ts" setup>
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import type { XoNetwork } from '@vates/types'

const { networks } = defineProps<{
  networks: XoNetwork[]
}>()

const model = defineModel<XoNetwork['id']>()

const { id } = useFormSelect(networks, {
  model,
  option: {
    label: 'name_label',
    value: 'id',
  },
})
</script>
