<!-- v7 -->
<template>
  <div class="accordion">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { IK_ACCORDION } from '@core/utils/injection-keys.util.ts'
import { ref, provide, reactive } from 'vue'

const expandedKey = ref<string | null>(null)

const toggle = (key: string) => {
  expandedKey.value = expandedKey.value === key ? null : key
}

export type UiAccordionController = {
  readonly expandedKey: string | null
  toggle: (key: string) => void
}

provide(
  IK_ACCORDION,
  reactive({
    expandedKey,
    toggle,
  })
)
</script>

<style scoped lang="postcss">
.accordion {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
