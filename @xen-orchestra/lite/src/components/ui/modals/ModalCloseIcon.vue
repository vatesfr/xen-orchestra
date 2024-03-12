<template>
  <UiIcon :color :icon="faXmark" class="modal-close-icon" @click="modal?.decline()" />
</template>

<script lang="ts" setup>
import { IK_MODAL } from '@/types/injection-keys'
import UiIcon from '@core/components/icon/UiIcon.vue'
import { useContext } from '@core/composables/context.composable'
import { ColorContext } from '@core/context'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { inject } from 'vue'

const color = useContext(ColorContext)

const modal = inject(IK_MODAL, undefined)
</script>

<style lang="postcss" scoped>
.modal-close-icon {
  font-size: 2rem;
  cursor: pointer;
}
</style>
