<template>
  <MenuItem :busy="isAttachingVdi" accent="neutral" icon="action:attach" @click="openVdiAttachDrawer()">
    {{ t('action:attach-vdi') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiAttach } from '@/modules/vdi/composables/use-vdi-attach.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { openVdiAttachDrawer, isAttachingVdi } = useVdiAttach(() => vm)
</script>
