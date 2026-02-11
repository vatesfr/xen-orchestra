<template>
  <MenuList placement="bottom-start">
    <template #trigger="{ open, isOpen }">
      <UiButton
        accent="brand"
        left-icon="action:more-actions"
        variant="tertiary"
        size="small"
        :selected="isOpen"
        @click="open($event)"
      />
    </template>
    <MenuItem
      icon="action:download"
      :busy="isFetching"
      :disabled="(isReady && poolMaster === undefined) || hasError"
      @click="download()"
    >
      {{ t('action:download-bugtools-archive') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import type { XenApiHost } from '@/libs/xen-api/xen-api.types'
import { useHostStore } from '@/stores/xen-api/host.store'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
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

  const link = document.createElement('a')
  link.href = `http://${poolMaster.value.address}/system-status?output=tar.bz2`
  link.download = 'system-status.tar.bz2'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
