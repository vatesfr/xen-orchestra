<template>
  <UiPanelCard>
    <UiPanelCardTitle
      size="medium"
      :label="vm?.name_label ?? backupArchive.vm.name_label"
      :to="vm !== undefined ? { name: '/vm/[id]/dashboard', params: { id: vm.id } } : undefined"
      :icon="vm !== undefined ? getVmIcon(vm) : 'object:vm'"
      :icon-tooltip="vm !== undefined ? getVmIconTooltip(vm) : undefined"
    />
    <VtsCardRowList>
      <VtsCardRowKeyValue>
        <template #key>{{ t('date') }}</template>
        <template #value>{{ formattedDate }}</template>
        <template #addons>
          <VtsCopyButton :value="formattedDate" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('vm') }}</template>
        <template #value>
          <UiLink
            v-if="vm !== undefined"
            size="small"
            :icon="getVmIcon(vm)"
            :icon-tooltip="getVmIconTooltip(vm)"
            :to="{ name: '/vm/[id]/dashboard', params: { id: vm.id } }"
          >
            {{ vm.name_label }}
          </UiLink>
          <template v-else>{{ backupArchive.vm.name_label }}</template>
        </template>
        <template #addons>
          <VtsCopyButton :value="vm?.name_label ?? backupArchive.vm.name_label" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('job') }}</template>
        <template #value>
          <UiLink
            v-if="job !== undefined"
            size="small"
            icon="object:backup-job"
            :to="{ name: '/admin/backup-and-replication/jobs', query: { id: job.id } }"
          >
            {{ job.name ?? t('untitled') }}
          </UiLink>
          <template v-else>{{ backupArchive.jobId }}</template>
        </template>
        <template v-if="job === undefined || job.name" #addons>
          <VtsCopyButton :value="job?.name ?? backupArchive.jobId" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('backup-repository') }}</template>
        <template #value>
          <UiLink
            v-if="br !== undefined"
            size="small"
            :icon="getBackupRepositoryIcon(br, parsedBrUrl?.type)"
            :to="{ name: '/admin/backup-repository/[id]/general', params: { id: br.id } }"
          >
            {{ br.name }}
          </UiLink>
          <template v-else>{{ backupArchive.backupRepository }}</template>
        </template>
        <template #addons>
          <VtsCopyButton :value="br?.name ?? backupArchive.backupRepository" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('type') }}</template>
        <template #value>{{ modeLabel }}</template>
        <template #addons>
          <VtsCopyButton :value="modeLabel" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue align-top>
        <template #key>{{ t('tags') }}</template>
        <template #value>
          <UiTagsList v-if="backupArchive.vm.tags.length > 0">
            <VtsTag v-for="tag in backupArchive.vm.tags" :key="tag" :value="tag" />
          </UiTagsList>
        </template>
        <template v-if="backupArchive.vm.tags.length > 0" #addons>
          <VtsCopyButton :value="backupArchive.vm.tags.join(', ')" />
        </template>
      </VtsCardRowKeyValue>
    </VtsCardRowList>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { useXoBackupJobCollection } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { useXoVmOperationLabel } from '@/modules/vm/composables/xo-vm-operation-label.composable.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmIcon } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardRowList from '@core/components/card/VtsCardRowList.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupArchive } = defineProps<{
  backupArchive: FrontXoVmBackupArchive
}>()

const { t } = useI18n()

const { getVmById } = useXoVmCollection()

const { getVmIconTooltip } = useXoVmOperationLabel()

const { useGetBackupJobById } = useXoBackupJobCollection()

const { useGetBackupRepositoryById } = useXoBackupRepositoryCollection()

const vm = computed(() => getVmById(backupArchive.vm.uuid as FrontXoVm['id']))

const job = useGetBackupJobById(() => backupArchive.jobId)

const br = useGetBackupRepositoryById(() => backupArchive.backupRepository)

const parsedBrUrl = useXoBackupRepositoryParsedUrl(br)

const formattedDate = computed(() => formatDateTime(backupArchive.timestamp))

const modeLabel = computed(() => (backupArchive.mode === 'delta' ? t('incremental') : t('full')))
</script>
