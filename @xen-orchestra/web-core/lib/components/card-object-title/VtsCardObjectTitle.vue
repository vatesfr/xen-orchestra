<template>
  <div class="vts-card-object-title">
    <UiLink v-if="label" size="medium" :to :href :icon>
      {{ label }}
    </UiLink>
    <VtsCodeSnippet class="id" :content="id" copy />
  </div>
</template>

<script setup lang="ts">
import VtsCodeSnippet from '@core/components/code-snippet/VtsCodeSnippet.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { IconName } from '@core/icons/index.ts'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{
  id: string
  label?: string
  icon?: IconName
  to?: RouteLocationRaw
  href?: string
}>()
</script>

<style scoped lang="postcss">
.vts-card-object-title {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 0.8rem;

  .id {
    width: 100%;
  }
}
</style>
