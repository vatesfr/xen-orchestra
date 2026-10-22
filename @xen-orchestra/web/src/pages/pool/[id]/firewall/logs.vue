<template>
  <div class="firewall-logs">
    <UiCard>
      <UiTitle>{{ t('firewall:logs') }}</UiTitle>
      <UiInfo accent="info" wrap>{{ t('firewall:log:info') }}</UiInfo>
      <VdfRuleLogTable :pool-id="pool.id" />
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfRuleLogTable from '@/modules/vdf/components/VdfRuleLogTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiInfo from '@core/components/ui/info/UiInfo.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  pool: FrontXoPool
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.firewall-logs {
  margin: 0.8rem;
}
</style>
