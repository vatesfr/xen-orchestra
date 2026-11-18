<template>
  <span class="json-schema-text">
    <template v-for="(segment, index) of segments" :key="index">
      <code v-if="segment.kind === 'code'" class="code">{{ segment.text }}</code>
      <UiLink v-else-if="segment.kind === 'link'" :href="segment.href" size="medium" display-inline>
        {{ segment.text }}
      </UiLink>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>

<script lang="ts" setup>
import { splitTextSegments } from '@/modules/plugin/utils/json-schema-description.util.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'

const { text } = defineProps<{
  text: string
}>()

const segments = computed(() => splitTextSegments(text))
</script>

<style lang="postcss" scoped>
.json-schema-text {
  white-space: pre-line;

  .code {
    color: var(--color-brand-txt-base);
    background-color: var(--color-neutral-background-secondary);
    border-radius: 0.4rem;
    padding-inline: 0.4rem;
  }
}
</style>
