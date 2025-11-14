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
import BackupJobTargetBrItem from '@/components/backups/panel/card-items/BackupJobTargetsBrItem.vue'
import BackupJobTargetSrItem from '@/components/backups/panel/card-items/BackupJobTargetsSrItem.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import type { XoBackupRepository, XoSr } from '@vates/types'

const { targets } = defineProps<{
  targets: XoSr[] | XoBackupRepository[]
  label: string
}>()

function isSr(target: XoSr | XoBackupRepository): target is XoSr {
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
