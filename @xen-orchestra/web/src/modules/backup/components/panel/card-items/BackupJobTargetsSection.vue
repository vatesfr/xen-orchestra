<template>
  <div class="content">
    <UiPanelCardTitle size="small" :label class="subtitle" />
    <UiCollapsibleList tag="ul" :total-items="targets.length">
      <template v-for="target in targets" :key="target.id">
        <BackupJobTargetSrItem v-if="isSr(target)" :sr="target" />
        <BackupJobTargetBrItem v-else :br="target" />
      </template>
    </UiCollapsibleList>
  </div>
</template>

<script setup lang="ts">
import BackupJobTargetBrItem from '@/modules/backup/components/panel/card-items/BackupJobTargetsBrItem.vue'
import BackupJobTargetSrItem from '@/modules/backup/components/panel/card-items/BackupJobTargetsSrItem.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'

const { targets } = defineProps<{
  targets: FrontXoSr[] | FrontXoBackupRepository[]
  label: string
}>()

function isSr(target: FrontXoSr | FrontXoBackupRepository): target is FrontXoSr {
  return 'type' in target && target.type === 'SR'
}
</script>

<style scoped lang="postcss">
.content {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;

  .subtitle {
    margin-bottom: 1.6rem;
  }
}
</style>
