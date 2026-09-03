<template>
  <MenuItem
    accent="brand"
    icon="action:disconnect"
    class="disconnect typo-body-bold-small"
    :busy="isDisconnectingServer"
    :disabled="!canDisconnectServer"
    @click="disconnectServer()"
  >
    {{ t('action:disconnect-pool') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useServerDisconnect } from '@/modules/server/composables/use-server-disconnect.composable.ts'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import type { XoServer } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const { serverByPool } = useXoServerCollection()

const serverId = computed(() => serverByPool.value.get(poolId)?.[0]?.id ?? ('' as XoServer['id']))

const { disconnectServer, canDisconnectServer, isDisconnectingServer } = useServerDisconnect(serverId)
</script>

<style lang="postcss" scoped>
.disconnect {
  color: var(--color-danger-item-base);
}
</style>
