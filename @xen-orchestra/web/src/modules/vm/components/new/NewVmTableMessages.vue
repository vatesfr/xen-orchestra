<template>
  <div v-if="errors.length > 0 || validation.warning !== undefined" class="new-vm-table-messages">
    <UiInfo v-for="error of errors" :key="error.key" accent="danger" size="small" wrap>{{ error.label }}</UiInfo>
    <UiInfo v-if="validation.warning !== undefined" accent="warning" size="small" wrap>
      {{ validation.warning }}
    </UiInfo>
  </div>
</template>

<script lang="ts" setup>
import type { NewVmTableRow } from '@/modules/vm/composables/use-new-vm-table-rows.composable.ts'
import type { NewVmTableValidation } from '@/modules/vm/form/new/use-new-vm-form-validation.ts'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import { computed } from 'vue'

const { rows, validation, getLabel } = defineProps<{
  rows: NewVmTableRow[]
  validation: NewVmTableValidation
  getLabel: (rank: number, issue: string) => string
}>()

const errors = computed(() =>
  rows.flatMap(row =>
    (validation.issues.get(row.item.key) ?? []).map((issue, issueIndex) => ({
      key: `${row.item.key}-${issueIndex}`,
      label: getLabel(row.rank, issue.message),
    }))
  )
)
</script>

<style lang="postcss" scoped>
.new-vm-table-messages {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
