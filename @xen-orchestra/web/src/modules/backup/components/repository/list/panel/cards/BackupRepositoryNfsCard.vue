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

      <VtsCardRowKeyValue v-if="nfs.port">
        <template #key>{{ t('port') }}</template>
        <template #value>{{ nfs.port }}</template>
        <template #addons>
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
        <template #value>{{ formatedOptions }}</template>
        <template v-if="formatedOptions" #addons>
          <VtsCopyButton :value="formatedOptions" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { ParsedNfsBackupRepositoryUrl } from '@/modules/backup/types/xo-backup-repository.type.ts'
import { formatMountOptions } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { options } = defineProps<{
  nfs: ParsedNfsBackupRepositoryUrl
  options?: string
}>()

const { t } = useI18n()

const formatedOptions = computed(() => formatMountOptions(options))
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
