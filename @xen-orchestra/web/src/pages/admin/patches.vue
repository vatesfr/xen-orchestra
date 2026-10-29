<template>
  <UiHeadBar>
    {{ t('patches') }}
    <template #actions>
      <UiButton
        accent="brand"
        variant="secondary"
        size="medium"
        left-icon="fa:rotate-left"
        :disabled="!canRefresh"
        :busy="isRefreshing"
        @click="refresh()"
      >
        {{ t('action:refresh') }}
      </UiButton>
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        :disabled="!canUpgrade || upgradablePackages.length === 0"
        :busy="isUpgrading"
        @click="openUpgradeAllModal()"
      >
        {{ t('action:upgrade-all') }}
      </UiButton>
    </template>
  </UiHeadBar>
  <div class="container">
    <VtsBanner v-if="isRebootRequired" accent="warning">
      {{ t('patches:reboot-required') }}
    </VtsBanner>
    <UiCard>
      <UpgradablePackagesTable
        :packages="upgradablePackages"
        :busy="!arePackageUpdatesReady"
        :error="hasPackageUpdatesFetchError"
      />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import UpgradablePackagesTable from '@/modules/xoa/components/UpgradablePackagesTable.vue'
import { useXoPackageRefreshJob } from '@/modules/xoa/jobs/xo-package-refresh.job.ts'
import { useXoPackageUpgradeJob } from '@/modules/xoa/jobs/xo-package-upgrade.job.ts'
import { useXoPackageUpdates } from '@/modules/xoa/remote-resources/use-xo-package-updates.ts'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { upgradablePackages, isRebootRequired, arePackageUpdatesReady, hasPackageUpdatesFetchError } =
  useXoPackageUpdates()

const { run: refresh, canRun: canRefresh, isRunning: isRefreshing } = useXoPackageRefreshJob()

const { run: upgradeAll, canRun: canUpgrade, isRunning: isUpgrading } = useXoPackageUpgradeJob(undefined)

const { open } = useOverlay({
  component: () => import('@/modules/xoa/components/modal/PackageUpgradeAllModal.vue'),
  events: {
    onConfirm: () => upgradeAll({ detached: true }),
    onCancel: true,
  },
})

function openUpgradeAllModal() {
  return open({ props: { count: upgradablePackages.value.length } })
}
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  gap: 0.8rem;
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
}
</style>
