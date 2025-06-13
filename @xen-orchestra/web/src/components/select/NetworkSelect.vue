<template>
  <VtsSelect :id accent="brand" />
</template>

<script lang="ts" setup>
import type { XoNetwork } from '@/types/xo/network.type.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'

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
