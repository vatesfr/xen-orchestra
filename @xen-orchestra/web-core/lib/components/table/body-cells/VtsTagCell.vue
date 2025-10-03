<template>
  <UiTableCell>
    <UiTagsList>
      <UiTag v-for="tag of tags" :key="tag" accent="info" variant="secondary">
        {{ tag }}
      </UiTag>
    </UiTagsList>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'

defineProps<{
  tags: string[]
}>()
</script>
