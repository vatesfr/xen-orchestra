<template>
  <div class="firewall-monitor">
    <!-- under Policies: the report of their monitor mode -->
    <UiLink :to="{ name: '/pool/[id]/firewall/policies', params: { id: pool.id } }" size="medium" icon="fa:angle-left">
      {{ t('firewall:monitor:back') }}
    </UiLink>
    <UiCard class="container">
      <UiTitle>
        {{ t('firewall:monitor:title') }}
        <template #action>
          <UiButton variant="tertiary" accent="brand" size="medium" left-icon="status:info-circle" @click="openInfo()">
            {{ t('firewall:monitor:about') }}
          </UiButton>
        </template>
      </UiTitle>
      <VdfMonitorReport :pool />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfMonitorReport from '@/modules/vdf/components/monitor/VdfMonitorReport.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { useI18n } from 'vue-i18n'

// What the pool's policies in monitor mode would drop if enforced (vdf#13)
const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { open: openInfoModal } = useInfoModal()

function openInfo() {
  openInfoModal({ props: { title: t('firewall:monitor:about'), content: t('firewall:monitor:info'), icon: 'fa:eye' } })
}
</script>

<style lang="postcss" scoped>
.firewall-monitor {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.8rem;
  margin: 0.8rem;

  .container {
    align-self: stretch;
  }

  .container {
    gap: 1.6rem;
  }
}
</style>
