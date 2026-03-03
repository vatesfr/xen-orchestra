<template>
  <MenuItem icon="action:download" @click="download()">{{ t('action:download-bugtools-archive') }}</MenuItem>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { downloadFile } from '@core/utils/download-file.utils.ts'
import { useI18n } from 'vue-i18n'

const { hostIp } = defineProps<{ hostIp: FrontXoHost['address'] }>()

const { t } = useI18n()

const download = () => {
  downloadFile(`http://${hostIp}/system-status?output=tar.bz2`, 'system-status.tar.bz2')
}
</script>
