<template>
  <UiCard class="card-container">
    <VtsCardObjectTitle :id="br.id" :label="br.name" :icon="brIcon" :href="xo5BrHref" />
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
        <template v-if="brType" #addons>
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
  </UiCard>
</template>

<script lang="ts" setup>
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { parseBackupRepositoryUrl } from '@/modules/backup/utils/xo-backup-repository-url.util.ts'
import { getBackupRepositoryIcon, getBackupRepositoryStatus } from '@/modules/backup/utils/xo-backup-repository.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsIcon from '@core/components/icon/VtsIcon.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const { buildXo5Route } = useXoRoutes()
const xo5BrHref = computed(() => buildXo5Route('/settings/remotes'))

const { useGetProxyById } = useXoProxyCollection()

const brInfo = computed(() => parseBackupRepositoryUrl(br.url))

const brType = computed(() => brInfo.value?.type)

const brIcon = computed(() => getBackupRepositoryIcon(br))

const brStatus = computed(() => getBackupRepositoryStatus(br))

const brStorageMode = computed(() => (brInfo.value?.useVhdDirectory ? t('block-based') : t('file-based')))

const isEncrypted = computed(() => brInfo.value?.encryptionKey !== undefined)

const brProxy = useGetProxyById(() => br.proxy)
</script>

<style scoped lang="postcss">
.card-container {
  gap: 1.6rem;

  .content {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
}
</style>
