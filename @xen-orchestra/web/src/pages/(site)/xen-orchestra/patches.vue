<template>
  <div class="patches">
    <VtsBanner v-if="isRestartNeeded" accent="warning">
      {{ t('patches:restart-needed') }}
    </VtsBanner>

    <VtsBanner v-if="distroUpgrade !== null" accent="brand">
      {{
        t('patches:distro-upgrade-available', {
          fromVersion: distroUpgrade.fromVersion,
          toVersion: distroUpgrade.toVersion,
        })
      }}
      <template #addons>
        <UiButton accent="brand" variant="secondary" size="small" @click="upgradeDistro()">
          {{ t('action:upgrade-distribution') }}
        </UiButton>
      </template>
    </VtsBanner>

    <div class="toolbar">
      <span class="count typo-body-regular-small">{{ t('patches:n-available', patches.length) }}</span>
      <UiButtonIcon
        accent="brand"
        icon="fa:rotate-left"
        size="medium"
        :title="t('action:refresh')"
        @click="refreshList()"
      />
      <UiButton
        accent="brand"
        variant="primary"
        size="medium"
        :disabled="patches.length === 0"
        @click="openUpgradeAllModal()"
      >
        {{ t('action:upgrade-all') }}
      </UiButton>
    </div>

    <VtsTable :state="tableState">
      <thead>
        <VtsRow>
          <VtsHeaderCell>{{ t('package') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('version') }}</VtsHeaderCell>
          <VtsHeaderCell>{{ t('description') }}</VtsHeaderCell>
          <VtsHeaderCell />
        </VtsRow>
      </thead>
      <tbody>
        <VtsRow v-for="patch in patches" :key="patch.name">
          <VtsTextCell>{{ patch.name }}</VtsTextCell>
          <VtsTextCell>{{ patch.version + '-' + patch.release }}</VtsTextCell>
          <VtsTruncatedTextCell :content="patch.description" />
          <VtsActionCell button-icon="fa:arrow-up" button-accent="brand" @click="upgradePatch(patch.name)" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </div>
</template>

<script lang="ts" setup>
import { useSystemUpdates } from '@/modules/xoa/composables/use-system-updates.ts'
import VtsBanner from '@core/components/banner/VtsBanner.vue'
import VtsActionCell from '@core/components/table/cells/VtsActionCell.vue'
import VtsHeaderCell from '@core/components/table/cells/VtsHeaderCell.vue'
import VtsTextCell from '@core/components/table/cells/VtsTextCell.vue'
import VtsTruncatedTextCell from '@core/components/table/cells/VtsTruncatedTextCell.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable, { type TableState } from '@core/components/table/VtsTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { useModal } from '@core/packages/modal/use-modal.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const { patches, isLoading, isRestartNeeded, distroUpgrade, refreshList, upgradePatch, upgradeAll, upgradeDistro } =
  useSystemUpdates()

const tableState = computed<TableState | undefined>(() => {
  if (isLoading.value) {
    return { type: 'busy' }
  }

  if (patches.value.length === 0) {
    return { type: 'no-data' }
  }

  return undefined
})

const openUpgradeAllModal = useModal(() => ({
  component: import('@/modules/xoa/components/UpgradeAllModal.vue'),
  props: { count: patches.value.length },
  onConfirm: () => upgradeAll(),
}))
</script>

<style scoped lang="postcss">
.patches {
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
