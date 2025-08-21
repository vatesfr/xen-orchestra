<template>
  <VtsSelect :id accent="brand" />
</template>

<script setup lang="ts">
import { useNetworkStore } from '@/stores/xen-api/network.store.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'
import type { XenApiNetwork } from '@vates/types'

const model = defineModel<XenApiNetwork['$ref']>()

const { records: networks } = useNetworkStore().subscribe()

const { id } = useFormSelect(networks, {
  model,
  searchable: true,
  option: {
    id: '$ref',
    label: 'name_label',
    value: '$ref',
  },
})
</script>
