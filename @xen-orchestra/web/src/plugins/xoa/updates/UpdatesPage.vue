<template>
  <div class="updates-page">
    <VtsBanner v-if="isRestartNeeded" accent="warning">
      XO needs to restart to apply updates.
      <template #addons>
        <UiButton accent="warning" variant="secondary" size="small" @click="restartXo">
          Restart XO
        </UiButton>
      </template>
    </VtsBanner>

    <VtsBanner v-if="distroUpgrade !== null" accent="brand">
      Debian upgrade available: {{ distroUpgrade.fromVersion }} → {{ distroUpgrade.toVersion }}
      <template #addons>
        <UiButton accent="brand" variant="secondary" size="small" @click="upgradeDistro">
          Upgrade distribution
        </UiButton>
      </template>
    </VtsBanner>

    <div class="toolbar">
      <span class="count typo-body-regular-small">{{ patches.length }} patch(es) available</span>
      <UiButtonIcon accent="brand" icon="fa:rotate-left" size="medium" title="Refresh" @click="refreshList" />
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        :disabled="patches.length === 0"
        @click="openUpgradeAllModal"
      >
        Upgrade All
      </UiButton>
    </div>

    <VtsTable :state="tableState">
      <thead>
        <VtsRow>
          <VtsHeaderCell>Package</VtsHeaderCell>
          <VtsHeaderCell>Version</VtsHeaderCell>
          <VtsHeaderCell>Description</VtsHeaderCell>
          <VtsHeaderCell />
        </VtsRow>
      </thead>
      <tbody>
        <VtsRow v-for="patch in patches" :key="patch.name">
          <VtsTextCell>{{ patch.name }}</VtsTextCell>
          <VtsTextCell>{{ patch.version }}-{{ patch.release }}</VtsTextCell>
          <VtsTruncatedTextCell :content="patch.description" />
          <VtsActionCell button-icon="fa:arrow-up" button-accent="brand" @click="upgradePatch(patch.name)" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsTextCell from '@core/components/table/cells/VtsTextCell.vue'
import VtsTruncatedTextCell from '@core/components/table/cells/VtsTruncatedTextCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable, { type TableState } from '@core/components/table/VtsTable.vue'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { computed } from 'vue'
import { useSystemUpdates } from './use-system-updates.ts'

const { patches, isLoading, isRestartNeeded, distroUpgrade, refreshList, upgradePatch, upgradeAll, upgradeDistro, restartXo } =
  useSystemUpdates()

const tableState = computed<TableState | undefined>(() => {
  if (isLoading.value) return { type: 'busy' }
  if (patches.value.length === 0) return { type: 'no-data' }
  return undefined
})

const openUpgradeAllModal = useModal(() => ({
  component: import('./UpgradeAllModal.vue'),
  props: { count: patches.value.length },
  onConfirm: () => upgradeAll(),
}))
</script>

<style scoped lang="postcss">
.updates-page {
  display: flex;
  flex-direction: column;

  .toolbar {
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 1.2rem 1.6rem;
    border-block-end: 0.1rem solid var(--color-neutral-border);

    .count {
      flex: 1;
      color: var(--color-neutral-txt-secondary);
    }
  }
}
</style>
