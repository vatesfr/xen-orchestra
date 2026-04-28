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
import { downloadBugTools } from '@core/utils/download-bugtools.utils.ts'
import { useI18n } from 'vue-i18n'

const { hostId } = defineProps<{ hostId: FrontXoHost['id'] }>()

const { t } = useI18n()

const { useGetHostById, areHostsFetching, areHostsReady, hasHostFetchError } = useXoHostCollection()

const host = useGetHostById(() => hostId)

const download = () => {
  if (!host.value) {
    return
  }

  downloadBugTools(host.value.address)
}
</script>
