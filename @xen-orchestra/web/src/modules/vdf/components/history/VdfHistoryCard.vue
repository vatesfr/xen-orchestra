<template>
  <UiCard class="vdf-history-card">
    <div class="heading">
      <UiTitle>{{ t('firewall:history:title') }}</UiTitle>
      <p class="typo-body-regular-small secondary">{{ t('firewall:history:info') }}</p>
    </div>
    <VtsStateHero v-if="!isHistoryReady && hasHistoryError" format="card" type="error" size="medium">
      {{ t('firewall:history:error') }}
      <UiButton variant="secondary" accent="brand" size="medium" @click="reloadHistory()">
        {{ t('retry') }}
      </UiButton>
    </VtsStateHero>
    <VtsStateHero v-else-if="!isHistoryReady" format="card" type="busy" size="medium" />
    <VtsStateHero v-else-if="entries.length === 0" format="card" type="no-data" size="medium">
      {{ t('firewall:history:empty') }}
      <span class="typo-body-regular secondary">{{ t('firewall:history:empty:info') }}</span>
    </VtsStateHero>
    <VdfHistoryTable
      v-else
      :id="`vdf-history-${scopeKey}`"
      :entries
      :current-id
      @view="entry => viewVersion(entry)"
      @restore="entry => restoreEntry(entry)"
    />
  </UiCard>
</template>

<script lang="ts" setup>
import VdfHistoryTable from '@/modules/vdf/components/history/VdfHistoryTable.vue'
import { useVdfHistoryPage } from '@/modules/vdf/composables/vdf-history.composable.ts'
import type { VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

const { scope } = defineProps<{
  scope: VdfScope
}>()

const { t } = useI18n()

const scopeKey = scope.kind === 'global' ? 'global' : scope.pool.id

const { entries, currentId, isHistoryReady, hasHistoryError, reloadHistory, viewVersion, restoreEntry } =
  useVdfHistoryPage(() => scope)
</script>

<style lang="postcss" scoped>
.vdf-history-card {
  margin: 0.8rem;
  gap: 2.4rem;

  .heading {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .secondary {
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
