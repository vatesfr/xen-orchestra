<template>
  <VtsIcon :class="textClass" name="fa:xmark" class="modal-close-icon" size="medium" @click="modal?.decline()" />
</template>

<script lang="ts" setup>
import { useContext } from '@/composables/context.composable'
import { ColorContext } from '@/context'
import { IK_MODAL } from '@/types/injection-keys'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { inject } from 'vue'

const { textClass } = useContext(ColorContext)

const modal = inject(IK_MODAL, undefined)
</script>

<style lang="postcss" scoped>
.modal-close-icon {
  font-size: 2rem;
  cursor: pointer;
}
</style>
