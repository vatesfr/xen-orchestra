<template>
  <VtsCardRowKeyValue>
    <template #key>
      {{ label }}
    </template>
    <template #value>
      <UiTagsList v-if="tags.length > 0">
        <UiTag v-for="tag in tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
      </UiTagsList>
    </template>
  </VtsCardRowKeyValue>
</template>

<script lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'

defineProps<{
  tags: string[]
  label: string
}>()
</script>
