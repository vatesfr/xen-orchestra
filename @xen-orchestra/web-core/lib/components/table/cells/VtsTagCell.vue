<template>
  <UiTableCell>
    <UiTagsList>
      <VtsTag v-for="tagItem in filteredTags" :key="tagItem" :tag="tagItem" />
    </UiTagsList>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { computed } from 'vue'

const { tag } = defineProps<{
  tag: MaybeArray<string>
}>()

const filteredTags = computed(() => toArray(tag).filter(tagItem => tagItem.trim() !== ''))
</script>
