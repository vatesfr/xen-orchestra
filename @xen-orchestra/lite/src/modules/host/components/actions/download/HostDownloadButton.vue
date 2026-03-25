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
import { useHostStore } from '@/stores/xen-api/host.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { downloadBugTools } from '@core/utils/download-bugtools.utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { hostOpaqueRef } = defineProps<{ hostOpaqueRef: XenApiHost['$ref'] }>()

const { t } = useI18n()

const { getByOpaqueRef, isReady, isFetching, hasError } = useHostStore().subscribe()

const poolMaster = computed(() => getByOpaqueRef(hostOpaqueRef))

const download = () => {
  if (poolMaster.value?.address === undefined) {
    return
  }

  downloadBugTools(poolMaster.value.address)
}
</script>
