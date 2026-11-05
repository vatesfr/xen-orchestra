<template>
  <VifDeleteButton :vif />
</template>

<script lang="ts" setup>
import VifDeleteButton from '@/modules/vif/components/actions/delete/VifDeleteButton.vue'
import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'

defineProps<{
  vif: FrontXoVif
}>()
</script>
