<template>
  <MenuItem
    icon="action:download"
    :busy="areHostsFetching"
    :disabled="(areHostsReady && primaryHost === undefined) || hasHostFetchError"
    @click="download()"
  >
    {{ t('action:download-bugtools-archive') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { downloadBugTools } from '@core/utils/download-bugtools.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const { getMasterHostByPoolId, areHostsFetching, areHostsReady, hasHostFetchError } = useXoHostCollection()

const primaryHost = computed(() => getMasterHostByPoolId(poolId))

const download = () => {
  if (primaryHost.value?.address === undefined) {
    return
  }

  downloadBugTools(primaryHost.value.address)
}
</script>
