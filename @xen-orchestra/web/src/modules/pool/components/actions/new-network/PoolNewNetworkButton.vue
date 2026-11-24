<template>
  <MenuItem :busy="isCreatingNetwork" accent="neutral" icon="fa:plus" @click="openNewNetworkDrawer()">
    {{ t('action:create-network') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useNewNetwork } from '@/modules/network/composables/use-new-network.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { openNewNetworkDrawer, isCreatingNetwork } = useNewNetwork(() => pool)
</script>
