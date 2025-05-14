<template>
  <UiCard class="pool-Connection">
    <UiTitle>
      {{ $t('connections') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('ip-address')" />
    <VtsQuickInfoRow :label="$t('proxy-url')" />
    <VtsQuickInfoRow :label="$t('username')" />
    <VtsQuickInfoRow :label="$t('read-only')" />
    <VtsQuickInfoRow :label="$t('self-signed-certificates')" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XoPool } from '@/types/xo/pool.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

defineProps<{ pool: XoPool }>()
</script>
