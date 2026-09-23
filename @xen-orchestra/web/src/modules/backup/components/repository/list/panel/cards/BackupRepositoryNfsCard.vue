<template>
  <UiPanelCard class="card-container">
    <UiCardTitle>{{ t('nfs') }}</UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('host') }}</template>
        <template #value>{{ nfs.host }}</template>
        <template #addons>
          <VtsCopyButton :value="nfs.host" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('port') }}</template>
        <template #value>{{ nfs.port }}</template>
        <template v-if="nfs.port" #addons>
          <VtsCopyButton :value="nfs.port" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('path-on-share') }}</template>
        <template #value>{{ nfs.path }}</template>
        <template #addons>
          <VtsCopyButton :value="nfs.path" />
        </template>
      </VtsCardRowKeyValue>

      <VtsCardRowKeyValue>
        <template #key>{{ t('custom-options') }}</template>
        <template #value>{{ formattedOptions }}</template>
        <template v-if="formattedOptions" #addons>
          <VtsCopyButton :value="formattedOptions" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { formatMountOptions } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedNfsBackupRepositoryUrl } from 'xo-remote-parser'

const { options } = defineProps<{
  nfs: ParsedNfsBackupRepositoryUrl
  options?: string
}>()

const { t } = useI18n()

const formattedOptions = computed(() => formatMountOptions(options))
</script>

<style scoped lang="postcss">
.card-container {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
