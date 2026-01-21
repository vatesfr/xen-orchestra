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
    <MenuItem icon="fa:download" @click="download">{{ t('download-bugtools-archive') }}</MenuItem>
  </MenuList>
</template>

<script lang="ts" setup>
import MenuItem from '@core/components/menu/MenuItem.vue'
import MenuList from '@core/components/menu/MenuList.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { hostIp } = defineProps<{ hostIp: string }>()

const { t } = useI18n()

const download = () => {
  const link = document.createElement('a')
  link.href = `http://${hostIp}/system-status?output=tar.bz2`
  link.download = 'system-status.tar.bz2'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
