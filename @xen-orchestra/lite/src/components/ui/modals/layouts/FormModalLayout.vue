<template>
  <ModalContainer tag="form">
    <template #header>
      <div class="title-bar" :class="color">
        <UiIcon :color :icon />
        <slot name="title" />
        <ModalCloseIcon class="close-icon" />
      </div>
    </template>

    <template #default>
      <slot />
    </template>

    <template #footer>
      <ButtonGroup class="footer-buttons">
        <slot name="buttons" />
      </ButtonGroup>
    </template>
  </ModalContainer>
</template>

<script lang="ts" setup>
import ModalCloseIcon from '@/components/ui/modals/ModalCloseIcon.vue'
import ModalContainer from '@/components/ui/modals/ModalContainer.vue'
import ButtonGroup from '@core/components/button/ButtonGroup.vue'
import UiIcon from '@core/components/icon/UiIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { ColorContext } from '@core/context'
import type { IconDefinition } from '@fortawesome/fontawesome-common-types'

defineProps<{
  icon?: IconDefinition
}>()

defineSlots<{
  title: () => void
  default: () => void
  buttons: () => void
}>()

const color = useContext(ColorContext)
</script>

<style lang="postcss" scoped>
.title-bar {
  display: flex;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  font-size: 2.4rem;
  gap: 1rem;
  padding-bottom: 1rem;
  font-weight: 500;
  align-items: center;

  &.info {
    border-color: var(--color-purple-base);
  }

  &.success {
    border-color: var(--color-green-base);
  }

  &.warning {
    border-color: var(--color-orange-base);
  }

  &.error,
  &.danger {
    border-color: var(--color-red-base);
  }
}

.close-icon {
  margin-left: auto;
  align-self: flex-start;
}

.footer-buttons {
  justify-content: flex-end;
}
</style>
