<template>
  <VtsStateHero v-if="!isVdfAvailabilityReady" format="page" type="busy" size="medium" class="vdf-gate" />
  <VtsStateHero v-else-if="!isVdfEnabled" format="page" type="no-data" size="medium" class="vdf-gate">
    {{ t('firewall:gate:disabled') }}
  </VtsStateHero>
  <VtsStateHero
    v-else-if="poolId !== undefined && !hasVdfAgent(poolId)"
    format="page"
    type="no-data"
    size="medium"
    class="vdf-gate"
  >
    {{ t('firewall:gate:no-agent') }}
  </VtsStateHero>
  <slot v-else />
</template>

<script lang="ts" setup>
import { useVdfAvailability } from '@/modules/vdf/composables/vdf-availability.composable.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useI18n } from 'vue-i18n'

// Firewall pages opened while the plugin is off (tech preview, opt-in), or
// for a pool whose hosts never ran the agent
const { poolId } = defineProps<{
  poolId?: string
}>()

const { t } = useI18n()

const { isVdfEnabled, isVdfAvailabilityReady, hasVdfAgent } = useVdfAvailability()
</script>

<style lang="postcss" scoped>
.vdf-gate {
  margin: 0.8rem;
}
</style>
