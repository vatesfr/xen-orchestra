<template>
  <MenuItem :busy="isDuplicatingVm" accent="neutral" icon="action:duplicate" @click="duplicateVm()">
    {{ t('action:duplicate') }}
  </MenuItem>
</template>

<script setup lang="ts">
import { useVmDuplicate } from '@/modules/vm/composables/use-vm-duplicate.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { duplicateVm, isDuplicatingVm } = useVmDuplicate(() => vm)
</script>
