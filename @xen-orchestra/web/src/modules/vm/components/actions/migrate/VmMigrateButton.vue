<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    icon="action:migrate"
    :disabled="isDisabled"
    :busy="isMigratingVm"
    :hint="migrateVmErrorMessage"
    @click="migrateVm()"
  >
    {{ t('action:migrate') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useVmMigrate } from '@/modules/vm/composables/use-vm-migrate.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { migrateVm, canMigrateVm, isMigratingVm, isMigrationBlocked, migrateVmErrorMessage } = useVmMigrate(() => vm)

const isDisabled = computed(() => !canMigrateVm.value && !isMigratingVm.value && !isMigrationBlocked.value)
</script>
