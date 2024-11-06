<template>
  <div :class="[backgroundClass, { nested: isNested }]" class="modal-container typo p1-regular">
    <header v-if="slots.header" class="modal-header">
      <slot name="header" />
    </header>
    <main v-if="slots.default" class="modal-content">
      <slot name="default" />
    </main>
    <footer v-if="slots.footer" class="modal-footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script lang="ts" setup>
import { useContext } from '@/composables/context.composable'
import { ColorContext } from '@/context'
import type { Color } from '@/types'
import { IK_MODAL_NESTED } from '@/types/injection-keys'
import { inject, provide } from 'vue'

const props = defineProps<{
  color?: Color
}>()

const slots = defineSlots<{
  header?(): any
  default?(): any
  footer?(): any
}>()

const { backgroundClass } = useContext(ColorContext, () => props.color)

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
