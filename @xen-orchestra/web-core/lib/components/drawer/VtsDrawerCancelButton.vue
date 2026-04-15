<template>
  <VtsDrawerButton variant="secondary" @click="handleClick">
    <slot>{{ t('cancel') }}</slot>
  </VtsDrawerButton>
</template>

<script lang="ts" setup>
import VtsDrawerButton from '@core/components/drawer/VtsDrawerButton.vue'
import { IK_DRAWER } from '@core/packages/drawer/types.ts'
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

const drawer = inject(IK_DRAWER)

function handleClick() {
  if (onClick) {
    emit('click')
    return
  }

  drawer?.value.onCancel()
}
</script>
