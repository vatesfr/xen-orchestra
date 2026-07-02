<template>
  <VtsOverlayButton variant="secondary" @click="handleClick">
    <slot>{{ t('cancel') }}</slot>
  </VtsOverlayButton>
</template>

<script lang="ts" setup>
import VtsOverlayButton from '@core/components/overlay/VtsOverlayButton.vue'
import { IK_OVERLAY } from '@core/packages/overlay/types.ts'
import { inject } from 'vue'
import { useI18n } from 'vue-i18n'

const { onClick } = defineProps<{
  onClick?: () => void
}>()

const emit = defineEmits<{
  click: []
}>()

defineSlots<{
  default?(): any
}>()

const { t } = useI18n()

const overlay = inject(IK_OVERLAY)

function handleClick() {
  if (onClick) {
    emit('click')
    return
  }

  overlay?.value.onCancel()
}
</script>
