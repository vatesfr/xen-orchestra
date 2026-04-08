<template>
  <div class="duplicate">
    <DuplicateVmForm :vm />
  </div>
</template>

<script setup lang="ts">
import DuplicateVmForm from '@/modules/vm/components/form/duplicate/DuplicateVmForm.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

const { vm } = defineProps<{ vm: FrontXoVm }>()
</script>

<style scoped lang="postcss">
.duplicate {
  margin: 0.8rem;
}
</style>
