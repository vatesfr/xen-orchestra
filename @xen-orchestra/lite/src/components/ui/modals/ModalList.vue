<template>
  <ModalListItem v-for="modal in modalStore.modals" :key="modal.id" :modal />
</template>

<script lang="ts" setup>
import ModalListItem from '@/components/ui/modals/ModalListItem.vue'
import { useModalStore } from '@/stores/modal.store'

const modalStore = useModalStore()
</script>
