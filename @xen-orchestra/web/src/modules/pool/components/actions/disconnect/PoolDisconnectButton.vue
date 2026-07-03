<template>
  <MenuItem icon="action:detach" :busy="isRunning" :disabled="!isConnected" class="disconnect" @click="openModal()">
    {{ t('action:disconnect-pool') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoServerDisconnectJob } from '@/modules/server/jobs/xo-server-disconnect.job.ts'
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import type { XoServer } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolId, poolName } = defineProps<{ poolId: FrontXoPool['id']; poolName: string }>()

const { t } = useI18n()

const { serverByPool } = useXoServerCollection()

const server = computed(() => serverByPool.value.get(poolId)?.[0])
const serverId = computed(() => server.value?.id ?? ('' as XoServer['id']))
const isConnected = computed(() => server.value?.status === 'connected')

const { isRunning, run } = useXoServerDisconnectJob([serverId])

const openModal = useModal(() => ({
  component: import('@/modules/pool/components/modal/PoolDisconnectModal.vue'),
  props: { poolName },
  onConfirm: () => run(),
}))
</script>

<style lang="postcss" scoped>
.disconnect {
  color: var(--color-danger-item-base);
}
</style>
