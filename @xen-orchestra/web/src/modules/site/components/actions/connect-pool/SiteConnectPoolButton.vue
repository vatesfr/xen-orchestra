<template>
  <MenuItem
    :busy="isConnectingPool"
    accent="neutral"
    icon="action:connect"
    class="typo-body-bold-small"
    @click="openPoolConnectionDrawer()"
  >
    {{ t('action:connect-pool') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { usePoolConnection } from '@/modules/pool/composables/use-pool-connection.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { openPoolConnectionDrawer, isConnectingPool } = usePoolConnection()
</script>
