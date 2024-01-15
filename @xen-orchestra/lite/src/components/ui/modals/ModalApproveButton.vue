<template>
  <UiButton :busy="modal.isBusy" type="submit">
    <slot />
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton from '@/components/ui/UiButton.vue'
import { IK_MODAL } from '@/types/injection-keys'
import { inject } from 'vue'

const modal = inject(IK_MODAL)!
</script>
