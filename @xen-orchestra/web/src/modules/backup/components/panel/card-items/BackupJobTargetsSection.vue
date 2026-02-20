<template>
  <div class="content">
    <span class="typo-body-bold-small subtitle">{{ label }}</span>
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
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-br-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'

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
    color: var(--color-neutral-txt-primary);
    margin-bottom: 1.6rem;
  }
}
</style>
