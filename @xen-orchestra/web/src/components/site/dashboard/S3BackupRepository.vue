<template>
  <div class="s3-backup-repository">
    <UiCardTitle>
      {{ t('s3-backup-repository') }}
      <template #description>{{ t('for-backup') }}</template>
    </UiCardTitle>
    <!--    TODO change and add loading when we have isReady available -->
    <VtsStateHero v-if="!areS3BackupRepositoriesReady" format="card" type="no-data" horizontal size="extra-small">
      {{ t('no-data-to-calculate') }}
    </VtsStateHero>
    <VtsStateHero v-else-if="hasError" format="card" type="error" size="extra-small" horizontal>
      {{ t('error-no-data') }}
    </VtsStateHero>
    <UiCardNumbers v-else :value="usedSize?.value" :unit="usedSize?.prefix" :label="t('used')" size="medium" />
  </div>
</template>

<script setup lang="ts">
import type { XoDashboard } from '@/types/xo/dashboard.type.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { size } = defineProps<{
  size: NonNullable<XoDashboard['backupRepositories']>['s3']['size'] | undefined
  hasError?: boolean
}>()

const { t } = useI18n()

const areS3BackupRepositoriesReady = computed(() => size !== undefined)

const usedSize = computed(() => formatSizeRaw(size?.backups, 1))
</script>

<style scoped lang="postcss">
.s3-backup-repository {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  flex: 1;
}
</style>
