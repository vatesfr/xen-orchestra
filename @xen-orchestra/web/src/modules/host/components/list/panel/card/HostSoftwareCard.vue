<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('software')" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('version') }}</template>
        <template #value>{{ host.version }}</template>
        <template #addons>
          <VtsCopyButton :value="host.version" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()
</script>
