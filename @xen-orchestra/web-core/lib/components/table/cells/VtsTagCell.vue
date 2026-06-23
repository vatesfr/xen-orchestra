<template>
  <UiTableCell>
    <UiTagsList>
      <VtsTag v-for="tagItem of tags" :key="tagItem" :value="tagItem" :accent />
    </UiTagsList>
  </UiTableCell>
</template>

<script setup lang="ts">
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiTableCell from '@core/components/ui/table-cell/UiTableCell.vue'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import type { MaybeArray } from '@core/types/utility.type'
import { toArray } from '@core/utils/to-array.utils'
import { computed } from 'vue'

const { tag, accent } = defineProps<{
  tag: MaybeArray<string>
  accent: TagAccent
}>()

const tags = computed(() => toArray(tag).filter(tagItem => tagItem.trim() !== ''))
</script>
