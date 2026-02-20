<template>
  <MenuItem
    icon="action:download"
    :busy="!areServersReady"
    :disabled="(areServersReady && server === undefined) || hasServerFetchError"
    @click="download()"
  >
    {{ t('action:download-bugtools-archive') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { downloadFile } from '@core/utils/download-file.utils'
import type { Branded } from '@vates/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: Branded<'pool'> }>()

const { t } = useI18n()

const { serverByPool, areServersReady, hasServerFetchError } = useXoServerCollection()

const server = computed(() => serverByPool.value.get(poolId)?.[0])

const download = () => {
  if (server.value === undefined) {
    return
  }
  downloadFile(`http://${server.value.host}/system-status?output=tar.bz2`, 'system-status.tar.bz2')
}
</script>
