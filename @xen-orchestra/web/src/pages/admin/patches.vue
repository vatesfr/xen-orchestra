<template>
  <UiHeadBar>
    {{ t('patches') }}
    <template #actions>
      <UiButton
        accent="brand"
        variant="secondary"
        size="medium"
        left-icon="fa:rotate-left"
        :disabled="!isPackageManagerLoaded || !canRefresh"
        :busy="isRefreshing"
        @click="refresh()"
      >
        {{ t('action:update') }}
      </UiButton>
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        :disabled="!isPackageManagerLoaded || !canUpgrade || upgradablePackages.length === 0"
        :busy="isUpgrading"
        @click="openUpgradeAllModal()"
      >
        {{ t('action:upgrade-all') }}
      </UiButton>
    </template>
  </UiHeadBar>
  <div class="container">
    <UiAlert v-if="isPackageManagerLoaded === false" accent="danger">
      <I18nT keypath="patches:plugin-not-loaded" scope="global">
        <template #plugin>
          <UiLink size="small" :to="getPluginRoute(PACKAGE_MANAGER_PLUGIN_ID)">{{ PACKAGE_MANAGER_PLUGIN_ID }}</UiLink>
        </template>
      </I18nT>
    </UiAlert>
    <VtsBanner v-if="isRebootRequired" accent="warning">
      {{ t('patches:reboot-required') }}
    </VtsBanner>
    <UiCard v-if="isPackageManagerLoaded">
      <UpgradablePackagesTable
        :packages="upgradablePackages"
        :busy="!arePackageUpdatesReady"
        :error="hasPackageUpdatesFetchError"
      />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import {
  type FrontXoPlugin,
  useXoPluginCollection,
} from '@/modules/plugin/remote-resources/use-xo-plugin-collection.ts'
import { getPluginRoute, isPluginLoaded } from '@/modules/plugin/utils/xo-plugin.util.ts'
import UpgradablePackagesTable from '@/modules/xoa/components/UpgradablePackagesTable.vue'
import { useXoPackageRefreshJob } from '@/modules/xoa/jobs/xo-package-refresh.job.ts'
import { useXoPackageUpgradeJob } from '@/modules/xoa/jobs/xo-package-upgrade.job.ts'
import { useXoPackageUpdates } from '@/modules/xoa/remote-resources/use-xo-package-updates.ts'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { useOverlay } from '@core/packages/overlay/use-overlay.ts'
import { computed, watch } from 'vue'
import { I18nT, useI18n } from 'vue-i18n'

const { t } = useI18n()

// the routes of the plugin only exist while it is loaded
const PACKAGE_MANAGER_PLUGIN_ID = 'package-manager' as FrontXoPlugin['id']

const { getPluginById, arePluginsReady } = useXoPluginCollection()

// undefined until the plugins are fetched
const isPackageManagerLoaded = computed(() => {
  if (!arePluginsReady.value) {
    return undefined
  }
  const plugin = getPluginById(PACKAGE_MANAGER_PLUGIN_ID)
  return plugin !== undefined && isPluginLoaded(plugin)
})

const { upgradablePackages, isRebootRequired, arePackageUpdatesReady, hasPackageUpdatesFetchError, $context } =
  useXoPackageUpdates()

// the packages were fetched before the plugin was loaded from the plugins page
watch(isPackageManagerLoaded, (isLoaded, wasLoaded) => {
  if (isLoaded === true && wasLoaded === false) {
    void $context.forceReload()
  }
})

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
