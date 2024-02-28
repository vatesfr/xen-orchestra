<template>
  <div :class="colorContextClass" class="dropdown-list">
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { useContext } from '@core/composables/context.composable'
import { ColorContext } from '@core/context'
import { IK_DROPDOWN_CHECKBOX } from '@core/utils/injection-keys.util'
import { computed, provide } from 'vue'

const props = defineProps<{
  checkbox?: boolean
}>()

const { colorContextClass } = useContext(ColorContext, 'info-alt')

provide(
  IK_DROPDOWN_CHECKBOX,
  computed(() => props.checkbox)
)
</script>

<style lang="postcss" scoped>
.dropdown-list {
  display: flex;
  flex-direction: column;
  padding: 0.4rem 0;
  gap: 0.2rem;
  border-radius: 0.4rem;
  background: var(--background-color-primary);
  box-shadow: var(--shadow-300);
}
</style>
