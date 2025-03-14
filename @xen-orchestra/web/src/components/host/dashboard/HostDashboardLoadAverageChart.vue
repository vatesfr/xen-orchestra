<template>
  <UiCard>
    <UiCardTitle>{{ $t('load-average') }}</UiCardTitle>
    <VtsLoadingHero :disabled="isReady" type="card">
      <!-- TODO: use LinearChart -->
    </VtsLoadingHero>
  </UiCard>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store'
import type { XoHost } from '@/types/xo/host.type'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'

defineProps<{
  host: XoHost
}>()

const { isReady } = useHostStore().subscribe()
</script>
