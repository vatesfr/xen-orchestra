<template>
  <VtsActionButton
    :hint="migrateVdiErrorMessage"
    variant="tertiary"
    accent="brand"
    icon="action:migrate"
    :disabled="!canMigrateVdi"
    :busy="isMigratingVdi"
    @click="migrateVdi()"
  >
    {{ t('action:migrate-vdi-on-sr') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useVdiMigrate } from '@/modules/vdi/composables/use-vdi-migrate.composable.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { vdi } = defineProps<{
  vdi: FrontXoVdi
}>()

const { t } = useI18n()

const { migrateVdi, canMigrateVdi, isMigratingVdi, migrateVdiErrorMessage } = useVdiMigrate(() => vdi)
</script>
