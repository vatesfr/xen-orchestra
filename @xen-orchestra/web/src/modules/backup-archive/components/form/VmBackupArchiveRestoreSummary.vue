<template>
  <dl class="vm-backup-archive-restore-summary">
    <div class="item">
      <dt class="typo-body-regular-small label">{{ t('vm') }}</dt>
      <dd class="typo-body-bold-small value">
        <VtsIcon name="fa:desktop" size="medium" />
        {{ vmName }}
      </dd>
    </div>
    <div class="item">
      <dt class="typo-body-regular-small label">{{ t('restore-point') }}</dt>
      <dd class="typo-body-bold-small value">
        <VtsIcon name="fa:calendar" size="medium" />
        {{ formattedDate }}
        <span class="typo-body-regular-small suffix">{{ t('dot-prefix', { value: modeLabel }) }}</span>
      </dd>
    </div>
    <div class="item">
      <dt class="typo-body-regular-small label">{{ t('repository') }}</dt>
      <dd class="typo-body-bold-small value">
        <VtsIcon name="fa:database" size="medium" />
        {{ br?.name ?? backupArchive.backupRepository }}
        <span v-if="proxy !== undefined" class="typo-body-regular-small suffix">
          {{ t('via-proxy', { proxy: proxy.name }) }}
        </span>
      </dd>
    </div>
  </dl>
</template>

<script lang="ts" setup>
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { type FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import { formatDateTime } from '@core/utils/time.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupArchive } = defineProps<{
  backupArchive: FrontXoVmBackupArchive
}>()

const { t } = useI18n()

const { getVmById } = useXoVmCollection()

const { useGetBackupRepositoryById } = useXoBackupRepositoryCollection()

const { useGetProxyById } = useXoProxyCollection()

const br = useGetBackupRepositoryById(() => backupArchive.backupRepository)

const proxy = useGetProxyById(() => br.value?.proxy)

const vmName = computed(
  () => getVmById(backupArchive.vm.uuid as FrontXoVm['id'])?.name_label ?? backupArchive.vm.name_label
)

const formattedDate = computed(() => formatDateTime(backupArchive.timestamp))

const modeLabel = computed(() => (backupArchive.mode === 'delta' ? t('incremental') : t('full')))
</script>

<style lang="postcss" scoped>
.vm-backup-archive-restore-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
  gap: 1.6rem;
  padding: 1.6rem;
  background-color: var(--color-neutral-background-primary);
  border: 0.1rem solid var(--color-neutral-border);
  border-radius: 0.8rem;

  .item {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  .label,
  .suffix {
    color: var(--color-neutral-txt-secondary);
  }

  .value {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }
}
</style>
