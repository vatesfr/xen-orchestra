<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('local')" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('path') }}</template>
        <template #value>{{ file.path }}</template>
        <template #addons>
          <VtsCopyButton :value="file.path" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'
import type { ParsedFileBackupRepositoryUrl } from 'xo-remote-parser'

defineProps<{
  file: ParsedFileBackupRepositoryUrl
}>()

const { t } = useI18n()
</script>
