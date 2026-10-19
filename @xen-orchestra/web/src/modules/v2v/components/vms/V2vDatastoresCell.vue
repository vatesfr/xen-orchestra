<template>
  <UiTableCell>
    <div class="v2v-datastores-cell">
      <UiButton
        v-for="name of names"
        :key="name"
        accent="brand"
        variant="tertiary"
        size="small"
        @click="emit('filter', name)"
      >
        {{ name }}
      </UiButton>
    </div>
  </UiTableCell>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'

defineProps<{
  names: string[]
}>()

const emit = defineEmits<{
  filter: [name: string]
}>()
</script>

<style lang="postcss" scoped>
/* One datastore per line: side by side, the names would widen the column the most */
.v2v-datastores-cell {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}
</style>
