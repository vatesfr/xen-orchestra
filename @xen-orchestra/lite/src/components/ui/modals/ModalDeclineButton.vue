<template>
  <VtsButton size="medium" color="normal" level="secondary" :busy="modal.isBusy" @click="modal.decline()">
    <slot>{{ $t('cancel') }}</slot>
  </VtsButton>
</template>

<script lang="ts" setup>
import { IK_MODAL } from '@/types/injection-keys'
import VtsButton from '@core/components/button/VtsButton.vue'
import { inject } from 'vue'

const modal = inject(IK_MODAL)!
</script>
