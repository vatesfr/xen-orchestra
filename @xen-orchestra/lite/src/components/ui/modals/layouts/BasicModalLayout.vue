<template>
  <ModalContainer>
    <template #header>
      <ModalCloseIcon class="close-icon" />
    </template>

    <template #default>
      <slot />
    </template>
  </ModalContainer>
</template>

<script lang="ts" setup>
import ModalCloseIcon from '@/components/ui/modals/ModalCloseIcon.vue'
import ModalContainer from '@/components/ui/modals/ModalContainer.vue'

defineSlots<{
  default: () => void
}>()
</script>

<style lang="postcss" scoped>
.close-icon {
  float: right;
}
</style>
