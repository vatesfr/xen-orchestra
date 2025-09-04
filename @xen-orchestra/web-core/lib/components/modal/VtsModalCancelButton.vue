<template>
  <VtsModalButton variant="secondary" @click="handleClick">
    <slot>{{ t('cancel') }}</slot>
  </VtsModalButton>
</template>

<script lang="ts" setup>
import VtsModalButton from '@core/components/modal/VtsModalButton.vue'
import { IK_MODAL } from '@core/packages/modal/types.ts'
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

const modal = inject(IK_MODAL)

function handleClick() {
  if (onClick) {
    emit('click')
    return
  }

  modal?.value.onCancel()
}
</script>
