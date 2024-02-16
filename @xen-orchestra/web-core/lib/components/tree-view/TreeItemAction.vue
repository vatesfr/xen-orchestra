<template>
  <div class="tree-item-action">
    <ButtonIcon :icon="faEllipsis" :aria-label="label" />
  </div>
</template>

<script lang="ts" setup>
import ButtonIcon from '@core/components/button/ButtonIcon.vue'
import { faEllipsis } from '@fortawesome/free-solid-svg-icons'

defineProps<{
  label: string
}>()
</script>

<style lang="postcss" scoped>
.tree-item-action {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
