<!-- v7 -->
<template>
  <div class="accordion">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { IK_ACCORDION } from '@core/utils/injection-keys.util.ts'
import { ref, provide, computed } from 'vue'

const { unique } = defineProps<{ unique?: boolean }>()

const expandedKey = ref<string | null>(null)

const toggle = (key: string) => {
  expandedKey.value = expandedKey.value === key ? null : key
}

export type UiAccordionController = {
  readonly expandedKey: string | null
  toggle: (key: string) => void
}

const controller = {
  get expandedKey() {
    return expandedKey.value
  },
  toggle,
}

const controllerRef = computed(() => (unique ? controller : undefined))

provide(IK_ACCORDION, controllerRef)
</script>

<style scoped lang="postcss">
.accordion {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
