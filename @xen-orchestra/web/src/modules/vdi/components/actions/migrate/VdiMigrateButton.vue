<template>
  <MenuItem
    icon="action:migrate"
    class="typo-body-bold-small"
    :disabled="!canMigrateVdi"
    :busy="isMigratingVdi"
    @click="handleClick()"
  >
    {{ t('action:migrate-vdi-on-sr') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiMigrateDrawer } from '@/modules/vdi/composables/use-vdi-migrate-drawer.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const {
  openDrawer: openVdiMigrateDrawer,
  canRun: canMigrateVdi,
  isRunning: isMigratingVdi,
  errorMessage: migrateVdiErrorMessage,
} = useVdiMigrateDrawer(() => vdi)

const hint = computed(() => (!canMigrateVdi.value ? migrateVdiErrorMessage.value : undefined))

function handleClick() {
  openVdiMigrateDrawer()
}
</script>
