<template>
  <UiCard class="card-container">
    <VtsCardObjectTitle :id="br.id" :label="br.name" />
    <div class="content">
      <VtsCardRowKeyValue>
        <template #key>{{ t('status') }}</template>
        <template #value>
          <VtsStatus :status="br.enabled" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('type') }}</template>
        <template #value>{{ BrType }}</template>
        <template v-if="BrType" #addons>
          <VtsCopyButton :value="BrType" />
        </template>
      </VtsCardRowKeyValue>
      <VtsCardRowKeyValue>
        <template #key>{{ t('storage-mode') }}</template>
        <template #value>{{ BrStorageMode }}</template>
        <VtsCopyButton :value="BrStorageMode" />
      </VtsCardRowKeyValue>
    </div>
  </UiCard>
</template>

<script lang="ts" setup>
import { getBackupRepositoryType } from '@/modules/backup/components/utils/xo-backup-repository.utils.ts'
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsCardRowKeyValue from '@core/components/card/VtsCardRowKeyValue.vue'
import VtsCardObjectTitle from '@core/components/card-object-title/VtsCardObjectTitle.vue'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsStatus from '@core/components/status/VtsStatus.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const BrType = computed(() => getBackupRepositoryType(br.url))
const BrStorageMode = computed(() => (getBackupRepositoryType(br.url) ? t('block-based') : t('file-based')))

// Ajouter le href sur le titre
</script>
