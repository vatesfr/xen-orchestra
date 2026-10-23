<template>
  <div class="firewall-logs">
    <UiCard class="container">
      <UiTitle>
        {{ t('firewall:logs') }}
        <template #action>
          <UiButton variant="tertiary" accent="brand" size="medium" left-icon="status:info-circle" @click="openInfo()">
            {{ t('firewall:log:about') }}
          </UiButton>
        </template>
      </UiTitle>
      <VdfRuleLogTable :pool-id="pool.id" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfRuleLogTable from '@/modules/vdf/components/VdfRuleLogTable.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useInfoModal } from '@core/composables/modals/use-info-modal.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()

const { open: openInfoModal } = useInfoModal()

function openInfo() {
  openInfoModal({ props: { title: t('firewall:log:about'), content: t('firewall:log:info'), icon: 'fa:list' } })
}
</script>

<style lang="postcss" scoped>
.firewall-logs {
  margin: 0.8rem;

  .container {
    gap: 2.4rem;
  }
}
</style>
