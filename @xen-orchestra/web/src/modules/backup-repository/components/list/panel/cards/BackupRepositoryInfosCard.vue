<template>
  <UiPanelCard class="backup-repository-infos-card">
    <UiPanelCardTitle
      :id="br.id"
      size="medium"
      :label="br.name"
      :to="{ name: '/admin/backup-repository/[id]/general', params: { id: br.id } }"
      :icon="brIcon"
    />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="brStatus" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('type') }}</template>
        <template #value>{{ brType }}</template>
        <template v-if="parsedBrUrl?.type" #addons>
          <VtsCopyButton :value="brType" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('storage-mode') }}</template>
        <template #value>{{ brStorageMode }}</template>
        <template #addons>
          <VtsCopyButton :value="brStorageMode" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('proxy') }}</template>
        <template v-if="brProxy" #value>
          <VtsIcon size="medium" name="object:proxy" />
          {{ brProxy.name }}
        </template>
        <template v-if="brProxy" #addons>
          <VtsCopyButton :value="brProxy.name" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('encryption') }}</template>
        <template #value>
          <VtsStatus :status="isEncrypted" />
        </template>
      </VtsCardRowKeyValue>
    </div>
  </UiPanelCard>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryUtils } from '@/modules/backup-repository/composables/use-xo-backup-repository-utils.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiPanelCard from '@core/components/ui/panel-card/UiPanelCard.vue'
import UiPanelCardTitle from '@core/components/ui/panel-card-title/UiPanelCardTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ParsedBackupRepositoryUrl } from 'xo-remote-parser'

const { br, parsedBrUrl } = defineProps<{
  br: FrontXoBackupRepository
  parsedBrUrl: ParsedBackupRepositoryUrl | undefined
}>()

const { t } = useI18n()

const { brStatus, brType, brStorageMode, brProxy, isEncrypted } = useXoBackupRepositoryUtils(
  () => br,
  () => parsedBrUrl
)

const brIcon = computed(() => getBackupRepositoryIcon(br, parsedBrUrl?.type))
</script>

<style scoped lang="postcss">
.backup-repository-infos-card {
  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
