<template>
  <ModalContainer>
    <template #header>
      <div class="close-bar">
        <ModalCloseIcon />
      </div>
    </template>

    <template #default>
      <UiIcon :icon :color class="main-icon" />
      <h4 v-if="$slots.title" class="title h4 semi-bold">
        <slot name="title" />
      </h4>
      <div v-if="$slots.default" class="content">
        <slot name="default" />
      </div>
    </template>

    <template #footer>
      <ButtonGroup>
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
  subtitle: () => void
  default: () => void
  buttons: () => void
}>()

const color = useContext(ColorContext)
</script>

<style lang="postcss" scoped>
.close-bar {
  text-align: right;
}

.main-icon {
  font-size: 4.8rem;
  margin-bottom: 2rem;
}

.titles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.subtitle {
  font-size: 1.6rem;
  font-weight: 400;
  color: var(--color-grey-200);
}

.title {
  color: var(--color-grey-100);
}

.content {
  color: var(--color-grey-200);
  font-size: 1.6rem;
  font-weight: 400;
}
</style>
