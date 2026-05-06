<template>
  <UiTertiaryTag v-if="parsedTag" :accent>
    <template #term>{{ parsedTag.term }}</template>
    {{ parsedTag.label }}
  </UiTertiaryTag>
  <UiTag v-else :accent :variant>
    {{ value }}
  </UiTag>
</template>

<script lang="ts" setup>
import UiTag, { type TagAccent } from '@core/components/ui/tag/UiTag.vue'
import UiTertiaryTag from '@core/components/ui/tag/UiTertiaryTag.vue'
import { parseTag } from '@core/utils/parse-tag.util'
import { computed } from 'vue'

type TagVariant = 'primary' | 'secondary'

const {
  value,
  accent = 'info',
  variant = 'secondary',
} = defineProps<{
  value: string
  accent?: TagAccent
  variant?: TagVariant
}>()

const parsedTag = computed(() => parseTag(value))
</script>
