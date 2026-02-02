<template>
  <div class="accordion">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { IK_ACCORDION } from '@core/utils/injection-keys.util'
import { ref, provide, reactive } from 'vue'

const expandedKey = ref<string | null>(null)

const toggle = (key: string) => {
  expandedKey.value = expandedKey.value === key ? null : key
}

export type UiAccordionController = {
  expandedKey: string | null
  toggle: (key: string) => void
}

const AccordionController = reactive({
  expandedKey,
  toggle,
}) satisfies UiAccordionController

provide(IK_ACCORDION, AccordionController)
</script>

<style scoped lang="postcss">
.accordion {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
}
</style>
