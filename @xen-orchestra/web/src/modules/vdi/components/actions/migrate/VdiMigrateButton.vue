<template>
  <MenuItem
    accent="brand"
    icon="action:migrate"
    :disabled="!canMigrateVdi"
    :busy="isMigratingVdi"
    @click="handleClick()"
  >
    {{ t('action:migrate-vdi-on-sr') }}
    <i v-if="hint">{{ hint }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVdiMigrate } from '@/modules/vdi/composables/use-vdi-migrate.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import MenuItem from '@xen-orchestra/web-core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const { migrateVdi, canMigrateVdi, isMigratingVdi, migrateVdiErrorMessage } = useVdiMigrate(() => vdi)

const hint = computed(() => (!canMigrateVdi.value ? migrateVdiErrorMessage.value : undefined))

function handleClick() {
  migrateVdi()
}
</script>
