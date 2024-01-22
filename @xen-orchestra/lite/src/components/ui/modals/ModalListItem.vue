<template>
  <component :is="modal.component" v-bind="modal.props" />
</template>

<script lang="ts" setup>
import type { ModalController } from '@/types'
import { IK_MODAL } from '@/types/injection-keys'
import { provide } from 'vue'

const props = defineProps<{
  modal: ModalController
}>()

provide(IK_MODAL, props.modal)
</script>
