<template>
  <VtsActionButton
    variant="tertiary"
    accent="brand"
    icon="action:download"
    :busy="isBusy"
    :disabled="isDisabled"
    @click="download()"
  >
    {{ t('action:download-bugtools-archive') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { usePoolBugToolsDownload } from '@/modules/pool/composables/use-pool-bugtools-download.composable.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { poolId } = defineProps<{ poolId: FrontXoPool['id'] }>()

const { t } = useI18n()

const { download, isBusy, isDisabled } = usePoolBugToolsDownload(() => poolId)
</script>
