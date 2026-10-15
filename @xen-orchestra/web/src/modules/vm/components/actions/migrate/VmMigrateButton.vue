<template>
  <MenuItem accent="neutral" icon="action:migrate" :disabled="isDisabled" :busy="isMigratingVm" @click="migrateVm()">
    {{ t('action:migrate') }}
    <i v-if="isDisabled" class="em-dash-prefix">{{ migrateVmErrorMessage }}</i>
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVmMigrate } from '@/modules/vm/composables/use-vm-migrate.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { migrateVm, canMigrateVm, isMigratingVm, isMigrationBlocked, migrateVmErrorMessage } = useVmMigrate(() => vm)

const isDisabled = computed(() => !canMigrateVm.value && !isMigratingVm.value && !isMigrationBlocked.value)
</script>
