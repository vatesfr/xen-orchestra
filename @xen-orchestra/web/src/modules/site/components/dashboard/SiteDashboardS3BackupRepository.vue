<template>
  <UiCard :has-error="isError">
    <div class="site-dashboard-s3-backup-repository">
      <UiCardTitle>
        {{ t('s3-backup-repository') }}
        <template #description>{{ t('for-backup') }}</template>
      </UiCardTitle>
      <VtsStateHero v-if="isLoading" format="card" type="busy" size="medium" />
      <VtsStateHero v-else-if="isEmpty" format="card" type="no-data" horizontal size="extra-small">
        {{ t('no-data-to-calculate') }}
      </VtsStateHero>
      <VtsStateHero v-else-if="isError" format="card" type="error" size="extra-small" horizontal>
        {{ t('error-no-data') }}
      </VtsStateHero>
      <UiCardNumbers
        v-else
        :value="usedSize?.value"
        :unit="usedSize?.prefix"
        :label="t('used-for-backup')"
        size="medium"
      />
    </div>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { dashboard, hasError } = useXoSiteDashboard()

const { t } = useI18n()

const dashboardBackupRepositories = computed(() => dashboard.value.backupRepositories)

const isLoading = computed(() => dashboardBackupRepositories.value === undefined)

const isError = computed(
  () =>
    hasError.value || (dashboardBackupRepositories.value !== undefined && 'error' in dashboardBackupRepositories.value)
)

const isEmpty = computed(
  () =>
    dashboardBackupRepositories.value !== undefined &&
    ('isEmpty' in dashboardBackupRepositories.value || !('s3' in dashboardBackupRepositories.value))
)

const usedSize = computed(() =>
  dashboardBackupRepositories.value !== undefined && 's3' in dashboardBackupRepositories.value
    ? formatSizeRaw(dashboardBackupRepositories.value.s3?.size.backups, 1)
    : undefined
)
</script>

<style scoped lang="postcss">
.site-dashboard-s3-backup-repository {
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
  flex: 1;
}
</style>
