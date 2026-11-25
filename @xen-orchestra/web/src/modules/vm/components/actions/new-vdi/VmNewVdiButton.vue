<template>
  <MenuItem :busy="isCreatingVdi" accent="neutral" icon="fa:plus" @click="openNewVdiDrawer()">
    {{ t('action:create-vdi') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useNewVdi } from '@/modules/vdi/composables/use-new-vdi.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { openNewVdiDrawer, isCreatingVdi } = useNewVdi(() => vm)
</script>
