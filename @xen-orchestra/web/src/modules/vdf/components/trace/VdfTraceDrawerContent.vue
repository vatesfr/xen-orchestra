<template>
  <div class="vdf-trace-drawer-content">
    <VdfTracePanel v-model:active="isActive" :pool :initial="query" />
    <!-- nothing traced yet: what was dropped lately, each a trace away -->
    <VdfRecentDropsCard v-if="!isActive" :pool-id="pool.id" :document="publishedDocument" />
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfRecentDropsCard from '@/modules/vdf/components/overview/VdfRecentDropsCard.vue'
import type { VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import VdfTracePanel from '@/modules/vdf/components/trace/VdfTracePanel.vue'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { ref } from 'vue'

const { pool, query } = defineProps<{
  pool: FrontXoPool
  query: VdfTraceQuery
}>()

const { publishedDocument } = useVdfPolicy(() => pool)

// a trace running or shown: the recent drops give way
const isActive = ref(false)
</script>

<style lang="postcss" scoped>
.vdf-trace-drawer-content {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
</style>
