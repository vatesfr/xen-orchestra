<template>
  <span class="vdf-service">
    <UiTag accent="muted" variant="primary">{{ proto.toUpperCase() }}</UiTag>
    <span v-if="port">{{ port }}</span>
  </span>
</template>

<script lang="ts" setup>
import UiTag from '@core/components/ui/tag/UiTag.vue'

// a protocol and its port, as "TCP 5432"
defineProps<{
  proto: string
  port?: string | number
}>()
</script>

<style lang="postcss" scoped>
.vdf-service {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  white-space: nowrap;
}
</style>
