<template>
  <div class="firewall-monitor">
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
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { useI18n } from 'vue-i18n'

// What the pool's policies in monitor mode would drop if enforced (vdf#13)
defineProps<{
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
  margin: 0.8rem;

  .container {
    gap: 1.6rem;
  }
}
</style>
