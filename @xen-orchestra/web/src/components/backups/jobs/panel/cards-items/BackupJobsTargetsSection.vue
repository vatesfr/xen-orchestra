<template>
  <div class="content">
    <span class="typo-body-bold-small subtitle">{{ label }}</span>
    <UiCollapsibleList tag="ul" :total-items="targets.length">
      <template v-for="target in targets" :key="target.id">
        <BackupJobsTargetsSrItem v-if="isSr(target)" :sr="target" />
        <BackupJobsTargetsBrItem v-else :br="target" />
      </template>
    </UiCollapsibleList>
  </div>
</template>

<script setup lang="ts">
import BackupJobsTargetsBrItem from '@/components/backups/jobs/panel/cards-items/BackupJobsTargetsBrItem.vue'
import BackupJobsTargetsSrItem from '@/components/backups/jobs/panel/cards-items/BackupJobsTargetsSrItem.vue'
import type { XoBackupRepository } from '@/types/xo/br.type.ts'
import type { XoSr } from '@/types/xo/sr.type.ts'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'

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
