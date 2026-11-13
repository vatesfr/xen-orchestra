<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('properties')" />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('immutable') }}</template>
        <template #value>
          <VtsStatus :status="backupArchive.isImmutable === true" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  backupArchive: FrontXoVmBackupArchive
}>()

const { t } = useI18n()
</script>
