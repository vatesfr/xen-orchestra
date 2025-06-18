<template>
  <UiCard class="host-dashboard-ram-provisioning">
    <UiCardTitle>{{ t('ram-provisioning') }}</UiCardTitle>
    <VtsLoadingHero v-if="!isReady" type="card" />
    <template v-else>
      <UiProgressBar :value="host.memory.usage" :max="host.memory.size" :legend="host.name_label" />
      <div class="total">
        <UiCardNumbers
          :label="t('total-assigned')"
          :unit="ramUsage.used.prefix"
          :value="ramUsage.used.value"
          size="medium"
        />
        <UiCardNumbers
          :label="t('total-free')"
          :unit="ramUsage.free.prefix"
          :value="ramUsage.free.value"
          size="medium"
        />
      </div>
    </template>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoHost } from '@/types/xo/host.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardNumbers from '@core/components/ui/card-numbers/UiCardNumbers.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: XoHost
}>()

const { t } = useI18n()

const { isReady } = useHostStore().subscribe()

const ramUsage = computed(() => {
  const total = host.memory.size
  const used = host.memory.usage

  return {
    total: formatSizeRaw(total, 0),
    used: formatSizeRaw(used, 0),
    free: formatSizeRaw(total - used, 0),
  }
})
</script>

<style lang="postcss" scoped>
.host-dashboard-ram-provisioning {
  .total {
    display: grid;
    grid-template-columns: 1fr 1fr;
    margin-block-start: auto;
  }
}
</style>
