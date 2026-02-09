<template>
  <MenuItem icon="action:download" @click="download()">{{ t('action:download-bugtools-archive') }}</MenuItem>
</template>

<script lang="ts" setup>
import { useDownloadBugtools } from '@/shared/composable/download-bugtools.composable.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { hostIp } = defineProps<{ hostIp: string }>()

const { t } = useI18n()
const { downloadArchive } = useDownloadBugtools()

const download = () => {
  downloadArchive(`http://${hostIp}/system-status?output=tar.bz2`, 'system-status.tar.bz2')
}
</script>
