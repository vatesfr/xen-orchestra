<template>
  <UiPanelCard class="backup-job-targets-card">
    <UiPanelCardTitle size="medium" :label="t('backup-targets')" :counter="backupTargetsCount" />
    <div v-if="storageRepositoryTargets.length > 0" class="targets">
      <UiPanelCardTitle size="small" :label="t('storage-repositories')" class="subtitle" />
      <UiCollapsibleList tag="ul" :total-items="storageRepositoryTargets.length">
        <li v-for="sr in storageRepositoryTargets" :key="sr.id">
          <UiLink size="small" :icon="getSrStatusIcon(sr)" :to="{ name: '/sr/[id]/general', params: { id: sr.id } }">
            {{ sr.name_label }}
          </UiLink>
        </li>
      </UiCollapsibleList>
    </div>
    <VtsDivider v-if="storageRepositoryTargets.length > 0 && backupRepositoryTargets.length > 0" type="stretch" />
    <div v-if="backupRepositoryTargets.length > 0" class="targets">
      <UiPanelCardTitle size="small" :label="t('backup-repositories')" class="subtitle" />
      <UiCollapsibleList tag="ul" :total-items="backupRepositoryTargets.length">
        <BackupJobTargetsBrItem v-for="br in backupRepositoryTargets" :key="br.id" :br />
      </UiCollapsibleList>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import BackupJobTargetsBrItem from '@/modules/backup-job/components/list/panel/card-items/BackupJobTargetsBrItem.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import UiCollapsibleList from '@core/components/ui/collapsible-list/UiCollapsibleList.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { storageRepositoryTargets, backupRepositoryTargets } = defineProps<{
  storageRepositoryTargets: FrontXoSr[]
  backupRepositoryTargets: FrontXoBackupRepository[]
}>()

const { t } = useI18n()

const { getSrStatusIcon } = useXoSrUtils()

const backupTargetsCount = computed(() => backupRepositoryTargets.length + storageRepositoryTargets.length)
</script>

<style scoped lang="postcss">
.backup-job-targets-card {
  .targets {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    .subtitle {
      margin-block-end: 1.6rem;
    }
  }
}
</style>
