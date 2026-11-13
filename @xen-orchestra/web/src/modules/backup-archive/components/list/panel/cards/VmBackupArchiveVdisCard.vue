<template>
  <UiPanelCard>
    <UiPanelCardTitle size="medium" :label="t('vdis')" :counter="backupArchive.disks.length" />
    <UiCollapsibleList tag="ul" :total-items="backupArchive.disks.length">
      <li v-for="disk in backupArchive.disks" :key="disk.id" class="disk typo-body-regular-small">
        <VtsIcon name="object:vdi" size="medium" />
        <span v-tooltip class="text-ellipsis">{{ disk.name || t('unknown') }}</span>
      </li>
    </UiCollapsibleList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  backupArchive: FrontXoVmBackupArchive
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.disk {
  display: flex;
  align-items: center;
  gap: 0.8rem;

  .text-ellipsis {
    min-width: 0;
  }
}
</style>
