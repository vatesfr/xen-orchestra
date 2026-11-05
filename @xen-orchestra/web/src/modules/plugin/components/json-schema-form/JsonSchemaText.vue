<template>
  <span class="json-schema-text">
    <template v-for="(segment, index) of segments" :key="index">
      <code v-if="segment.isCode" class="code">{{ segment.text }}</code>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>

<script lang="ts" setup>
import { splitCodeSpans } from '@/modules/plugin/utils/json-schema-description.util.ts'
import { computed } from 'vue'

const { text } = defineProps<{
  text: string
}>()

const segments = computed(() => splitCodeSpans(text))
</script>

<style lang="postcss" scoped>
.json-schema-text {
  .code {
    color: var(--color-brand-txt-base);
    background-color: var(--color-neutral-background-secondary);
    border-radius: 0.4rem;
    padding-inline: 0.4rem;
  }
}
</style>
