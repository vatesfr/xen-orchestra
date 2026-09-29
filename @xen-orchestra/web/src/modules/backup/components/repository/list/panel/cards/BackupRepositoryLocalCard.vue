<template>
  <UiPanelCard class="backup-repository-local-card">
    <UiCardTitle>{{ t('local') }}</UiCardTitle>
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('path') }}</template>
        <template #value>{{ file.path }}</template>
        <template #addons>
          <VtsCopyButton :value="file.path" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import { useI18n } from 'vue-i18n'
import type { ParsedFileBackupRepositoryUrl } from 'xo-remote-parser'

defineProps<{
  file: ParsedFileBackupRepositoryUrl
}>()

const { t } = useI18n()
</script>

<style scoped lang="postcss">
.backup-repository-local-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
