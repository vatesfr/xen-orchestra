<template>
  <UiButton size="medium" accent="brand" variant="primary" :busy="modal.isBusy" type="submit">
    <slot />
  </UiButton>
</template>

<script lang="ts" setup>
import { IK_MODAL } from '@/types/injection-keys'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { inject } from 'vue'

const modal = inject(IK_MODAL)!
</script>
