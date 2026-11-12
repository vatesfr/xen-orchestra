<template>
  <VtsSelect :id accent="brand" />
</template>

<script lang="ts" setup generic="TId extends string">
import type { V2vTargetOption } from '@/modules/v2v/types/v2v-mapping.type.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { useFormSelect } from '@core/packages/form-select'

const { options, loading } = defineProps<{
  options: V2vTargetOption<TId>[]
  loading?: boolean
}>()

const model = defineModel<TId>()

const { id } = useFormSelect(() => options, {
  model,
  loading: () => loading,
  searchable: true,
  option: { value: 'id' },
})
</script>
