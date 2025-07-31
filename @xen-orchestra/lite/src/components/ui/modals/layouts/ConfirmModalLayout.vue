<template>
  <ModalContainer>
    <template #header>
      <div class="close-bar">
        <ModalCloseIcon />
      </div>
    </template>

    <template #default>
      <VtsIcon :class="textClass" :name="icon" class="main-icon" size="medium" />
      <div v-if="slots.title || slots.subtitle" class="titles">
        <UiTitle v-if="slots.title" type="h4">
          <slot name="title" />
        </UiTitle>
        <div v-if="slots.subtitle" class="subtitle typo-body-regular">
          <slot name="subtitle" />
        </div>
      </div>
      <div v-if="slots.default">
        <slot name="default" />
      </div>
    </template>

    <template #footer>
      <VtsButtonGroup>
        <slot name="buttons" />
      </VtsButtonGroup>
    </template>
  </ModalContainer>
</template>

<script lang="ts" setup>
import ModalCloseIcon from '@/components/ui/modals/ModalCloseIcon.vue'
import ModalContainer from '@/components/ui/modals/ModalContainer.vue'
import UiTitle from '@/components/ui/UiTitle.vue'
import { useContext } from '@/composables/context.composable'
import { ColorContext } from '@/context'
import type { IconName } from '@core/icons'
import VtsButtonGroup from '@core/components/button-group/VtsButtonGroup.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'

defineProps<{
  icon?: IconName
}>()

const slots = defineSlots<{
  buttons(): any
  default?(): any
  title?(): any
  subtitle?(): any
}>()

const { textClass } = useContext(ColorContext)
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
  font-weight: 400;
  color: var(--color-neutral-txt-secondary);
}
</style>
