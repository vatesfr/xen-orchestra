<template>
  <MenuItem v-if="canMigrateVdi" icon="action:migrate" :busy="isMigratingVdi" @click="handleClick()">
    {{ t('action:migrate-vdi-on-sr') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiMigrateDrawer } from '@/modules/vdi/composables/use-vdi-migrate-drawer.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const {
  openDrawer: openVdiMigrateDrawer,
  canRun: canMigrateVdi,
  isRunning: isMigratingVdi,
} = useVdiMigrateDrawer(() => vdi)

function handleClick() {
  openVdiMigrateDrawer()
}
</script>
