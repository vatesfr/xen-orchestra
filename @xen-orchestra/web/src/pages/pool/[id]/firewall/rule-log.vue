<template>
  <div class="firewall-rule-log">
    <!-- the page's live updates and what the log is, in the header -->
    <Teleport defer :to="`#${VDF_NAV_ACTIONS_ID}`">
      <div class="actions">
        <VdfLiveIndicator v-model:paused="isPaused" :label="t('firewall:log:refreshing')" />
        <UiButton variant="tertiary" accent="brand" size="small" left-icon="status:info-circle" @click="openLogInfo()">
          {{ t('firewall:log:about') }}
        </UiButton>
      </div>
    </Teleport>
    <UiCard>
      <VdfRuleLogTable :pool-id="pool.id" :paused="isPaused" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfLiveIndicator from '@/modules/vdf/components/live/VdfLiveIndicator.vue'
import VdfRuleLogTable from '@/modules/vdf/components/VdfRuleLogTable.vue'
import { VDF_NAV_ACTIONS_ID } from '@/modules/vdf/utils/vdf-global.util.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

// What rules and policies that log recorded, each drop and allow with its
// rule: a page of its own, as it runs long. Traffic keeps the flows dropped
// lately (vdf#139).
const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const isPaused = ref(false)

const { open: openInfoModal } = useInfoModal()

function openLogInfo() {
  openInfoModal({ props: { title: t('firewall:log:about'), content: t('firewall:log:info'), icon: 'fa:list' } })
}
</script>

<style lang="postcss" scoped>
.firewall-rule-log {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .actions {
    display: flex;
    align-items: center;
    gap: 1.6rem;
  }
}
</style>
