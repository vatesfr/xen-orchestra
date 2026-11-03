<template>
  <div class="firewall-settings">
    <!-- vdf#103: the pool's DHCP servers and routers, declared by groups -->
    <VdfServicesCard :pool />

    <UiCard class="limits">
      <UiTitle>
        {{ t('firewall:limits') }}
        <template #action>
          <UiButton variant="tertiary" accent="brand" size="medium" left-icon="fa:sliders" @click="editLimits()">
            {{ t('action:edit') }}
          </UiButton>
        </template>
      </UiTitle>
      <span class="secondary typo-body-regular-small">{{ t('firewall:limits:info') }}</span>
      <VtsTabularKeyValueList>
        <VtsTabularKeyValueRow :label="t('firewall:limits:ceiling')" :value="ceilingText" />
        <VtsTabularKeyValueRow :label="t('firewall:limits:meter')" :value="meterText" />
      </VtsTabularKeyValueList>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfServicesCard from '@/modules/vdf/components/services/VdfServicesCard.vue'
import { useVdfEditors } from '@/modules/vdf/composables/vdf-editors.composable.ts'
import { useVdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

// What the pool's policies rely on, set once: its infrastructure services
// and its connection limits, both part of the draft
const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const { t, n } = useI18n()

const { document } = useVdfScope(() => ({ kind: 'pool' as const, pool }))

const { editLimits } = useVdfEditors(() => ({ kind: 'pool' as const, pool }))

// agent semantics (VdfLimitsDrawer): ceiling 0 = 10 % of the host's
// connection table, -1 = off; meter 0 or -1 = off
const ceilingText = computed(() => {
  const ceiling = document.value.limits?.maxConnPerVIF ?? 0

  if (ceiling === 0) {
    return t('firewall:limits:ceiling:auto')
  }

  return ceiling < 0 ? t('firewall:limits:ceiling:off') : t('firewall:limits:ceiling:fixed', { n: n(ceiling) })
})

const meterText = computed(() => {
  const meter = document.value.limits?.newConnPerSec ?? 0

  return meter > 0 ? t('firewall:limits:meter:fixed', { n: n(meter) }) : t('firewall:limits:meter:off')
})
</script>

<style lang="postcss" scoped>
.firewall-settings {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;

  .limits {
    gap: 1.6rem;
  }
}
</style>
