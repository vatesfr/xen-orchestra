<template>
  <ModalContainer>
    <ModalCloseIcon class="close-icon" />
    <ModalContent>
      <slot />
    </ModalContent>
  </ModalContainer>
</template>

<script setup lang="ts">
import ModalCloseIcon from "@/components/ui/modals/ModalCloseIcon.vue";
import ModalContainer from "@/components/ui/modals/ModalContainer.vue";
import ModalContent from "@/components/ui/modals/ModalContent.vue";
</script>

<style scoped lang="postcss">
.close-icon {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 10;
}
</style>
