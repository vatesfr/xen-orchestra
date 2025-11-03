<!-- v1 -->
<template>
  <div class="ui-tags-list" :class="{ nowrap }">
    <slot />
  </div>
</template>

<script lang="ts" setup>
defineProps<{
  nowrap?: boolean
}>()
</script>

<style lang="postcss" scoped>
.ui-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.nowrap {
  flex-wrap: nowrap;
}
</style>
