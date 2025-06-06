<template>
  <UiButton size="medium" accent="brand" variant="secondary" :busy="modal.isBusy" @click="modal.decline()">
    <slot>{{ t('cancel') }}</slot>
  </UiButton>
</template>

<script lang="ts" setup>
import { IK_MODAL } from '@/types/injection-keys'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const modal = inject(IK_MODAL)!
</script>
