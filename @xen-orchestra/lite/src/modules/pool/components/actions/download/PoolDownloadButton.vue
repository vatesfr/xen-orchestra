<template>
  <MenuItem
    icon="action:download"
    :busy="isFetching"
    :disabled="(isReady && poolMaster === undefined) || hasError"
    @click="download()"
  >
    {{ t('action:download-bugtools-archive') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { downloadFile } from '@core/utils/download-file.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { masterHost } = defineProps<{ masterHost: XenApiHost['$ref'] }>()

const { t } = useI18n()

const { getByOpaqueRef, isReady, isFetching, hasError } = useHostStore().subscribe()

const poolMaster = computed(() => getByOpaqueRef(masterHost))

const download = () => {
  if (poolMaster.value?.address === undefined) {
    return
  }

  downloadFile(`http://${poolMaster.value.address}/system-status?output=tar.bz2`, 'system-status.tar.bz2')
}
</script>
