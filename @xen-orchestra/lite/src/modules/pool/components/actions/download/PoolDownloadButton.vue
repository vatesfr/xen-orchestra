<template>
  <MenuItem
    icon="action:download"
    :busy="isFetching"
    :disabled="(isReady && primaryHost === undefined) || hasError"
    @click="download()"
  >
    {{ t('action:download-bugtools-archive') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types.ts'
import { useHostStore } from '@/stores/xen-api/host.store.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { downloadBugTools } from '@core/utils/download-bugtools.utils.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { masterHostOpaqueRef } = defineProps<{ masterHostOpaqueRef: XenApiHost['$ref'] }>()

const { t } = useI18n()

const { getByOpaqueRef, isReady, isFetching, hasError } = useHostStore().subscribe()

const primaryHost = computed(() => getByOpaqueRef(masterHostOpaqueRef))

const download = () => {
  if (primaryHost.value?.address === undefined) {
    return
  }

  downloadBugTools(primaryHost.value.address)
}
</script>
