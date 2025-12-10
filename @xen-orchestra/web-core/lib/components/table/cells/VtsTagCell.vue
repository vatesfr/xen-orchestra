<template>
  <UiTableCell>
    <UiTagsList>
      <UiTag v-for="tagItem of tags" :key="tagItem" accent="info" variant="secondary">
        {{ tagItem }}
      </UiTag>
    </UiTagsList>
  </UiTableCell>
</template>

<script setup lang="ts">
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { computed } from 'vue'

const { tag } = defineProps<{
  tag: MaybeArray<string>
}>()

const tags = computed(() => toArray(tag).filter(tagItem => tagItem.trim() !== ''))
</script>
