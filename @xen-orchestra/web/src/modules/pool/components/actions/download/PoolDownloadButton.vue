<template>
  <MenuItem
    accent="brand"
    icon="action:download"
    class="typo-body-bold-small"
    :busy="isBusy"
    :disabled="isDisabled"
    @click="download"
  >
    {{ t('action:download-bugtools-archive') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { usePoolBugToolsDownload } from '@/modules/pool/composables/use-pool-bugtools-download.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const { download, isBusy, isDisabled } = usePoolBugToolsDownload(() => poolId)
</script>
