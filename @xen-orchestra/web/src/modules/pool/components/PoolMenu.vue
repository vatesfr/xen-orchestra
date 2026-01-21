<template>
  <MenuList placement="bottom-start">
    <template #trigger="{ open, isOpen }">
      <UiButton
        accent="brand"
        left-icon="fa:ellipsis"
        variant="tertiary"
        size="small"
        :selected="isOpen"
        @click="open($event)"
      />
    </template>
    <MenuItem
      icon="fa:download"
      :busy="!areServersReady"
      :disabled="(areServersReady && server === undefined) || hasServerFetchError"
      @click="download"
    >
      {{ t('download-bugtools-archive') }}
    </MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import { useXoServerCollection } from '@/modules/server/remote-resources/use-xo-server-collection'
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
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
  const link = document.createElement('a')

  link.href = `http://${server.value.host}/system-status?output=tar.bz2`
  link.download = 'system-status.tar.bz2'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
