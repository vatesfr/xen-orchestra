<template>
  <UiButton outlined :busy="modal.isBusy" @click="modal.decline()">
    <slot>{{ $t('cancel') }}</slot>
  </UiButton>
</template>

<script lang="ts" setup>
import UiButton from '@core/components/button/UiButton.vue'
import { IK_MODAL } from '@/types/injection-keys'
import { inject } from 'vue'

const modal = inject(IK_MODAL)!
</script>
