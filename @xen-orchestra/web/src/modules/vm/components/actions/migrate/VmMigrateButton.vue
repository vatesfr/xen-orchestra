<template>
  <MenuItem accent="neutral" icon="action:migrate" :busy="isMigrating" @click="migrateVm()">
    {{ t('action:migrate') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useVmMigrate } from '@/modules/vm/composables/use-vm-migrate.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { isVmOperationPending } from '@/modules/vm/utils/xo-vm.util.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { VM_OPERATIONS } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { t } = useI18n()

const { migrateVm } = useVmMigrate(() => vm)

const isMigrating = computed(() => isVmOperationPending(vm, [VM_OPERATIONS.POOL_MIGRATE, VM_OPERATIONS.MIGRATE_SEND]))
</script>
