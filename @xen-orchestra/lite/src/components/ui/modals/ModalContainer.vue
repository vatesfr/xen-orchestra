<template>
  <div :class="[color, { nested: isNested }]" class="modal-container">
    <header v-if="$slots.header" class="modal-header">
      <slot name="header" />
    </header>
    <main v-if="$slots.default" class="modal-content">
      <slot name="default" />
    </main>
    <footer v-if="$slots.footer" class="modal-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { IK_MODAL_NESTED } from '@/types/injection-keys'
import { useContext } from '@core/composables/context.composable'
import { ColorContext } from '@core/context'
import type { Color } from '@core/types/color.type'
import { inject, provide } from 'vue'

const props = defineProps<{
  color?: Color
}>()

defineSlots<{
  header: () => any
  default: () => any
  footer: () => any
}>()

const color = useContext(ColorContext, () => props.color)

const isNested = inject(IK_MODAL_NESTED, false)
provide(IK_MODAL_NESTED, true)
</script>

<style lang="postcss" scoped>
.modal-container {
  display: grid;
  grid-template-rows: 1fr auto 1fr;
  max-width: calc(100vw - 2rem);
  max-height: calc(100vh - 20rem);
  padding: 2rem;
  gap: 1rem;
  border-radius: 1rem;
  font-size: 1.6rem;
  background-color: var(--background-color);
  --background-color: var(--background-color-primary);

  &.info {
    --background-color: var(--background-color-purple-10);
  }

  &.success {
    --background-color: var(--background-color-green-10);
  }

  &.warning {
    --background-color: var(--background-color-orange-10);
  }

  &.error,
  &.danger {
    --background-color: var(--background-color-red-10);
  }

  &:not(.nested) {
    min-width: 40rem;
    box-shadow: var(--shadow-400);
  }

  &.nested {
    margin-top: 2rem;
  }
}

.modal-header {
  grid-row: 1;
}

.modal-content {
  text-align: center;
  grid-row: 2;
  padding: 2rem;
  max-height: 75vh;
  overflow: auto;
}

.modal-footer {
  grid-row: 3;
  align-self: end;
}
</style>
