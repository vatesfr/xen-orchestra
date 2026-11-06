<template>
  <VtsStateHero format="page" type="busy" size="large" />
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import { useVdfTraceDrawer } from '@/modules/vdf/composables/vdf-trace-drawer.composable.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import { useRoute, useRouter } from 'vue-router'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

// Trace is no tab any more, but a drawer over any of them. This route stays
// for the links and bookmarks made before (a trace's query, run=1 runs it):
// the Overview, with the drawer open on that query. Opened once there, as
// XO closes overlays on every navigation.

const route = useRoute()

const router = useRouter()

const { openTrace } = useVdfTraceDrawer()

const query = { ...route.query } as VdfTraceQuery

void router.replace({ name: '/pool/[id]/firewall/overview', params: { id: pool.id } }).then(failure => {
  if (failure === undefined) {
    void openTrace(pool.id, query)
  }
})
</script>
