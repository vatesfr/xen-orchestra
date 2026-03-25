<template>
  <MenuItem
    icon="action:download"
    :busy="areHostsFetching"
    :disabled="(areHostsReady && host === undefined) || hasHostFetchError"
    @click="download()"
  >
    {{ t('action:download-bugtools-archive') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useXoHostCollection, type FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { downloadBugTools } from '@core/utils/download-bugtools.utils'
import { useI18n } from 'vue-i18n'

const { hostId } = defineProps<{ hostId: FrontXoHost['id'] }>()

const { t } = useI18n()

const { getHostById, areHostsFetching, areHostsReady, hasHostFetchError } = useXoHostCollection()

const host = getHostById(hostId)

const download = () => {
  if (!host) {
    return
  }

  downloadBugTools(host.address)
}
</script>
