<template>
  <MenuItem
    icon="action:download"
    :busy="areHostsFetching"
    :disabled="(areHostsReady && poolMaster === undefined) || hasHostFetchError"
    @click="download()"
  >
    {{ t('action:download-bugtools-archive') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { downloadBugTools } from '@core/utils/download-bugtools.utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const { getMasterHostByPoolId, areHostsFetching, areHostsReady, hasHostFetchError } = useXoHostCollection()

const poolMaster = computed(() => getMasterHostByPoolId(poolId))

const download = () => {
  if (poolMaster.value?.address === undefined) {
    return
  }

  downloadBugTools(poolMaster.value.address)
}
</script>
