<template>
  <div class="firewall-trace">
    <VdfTracePanel
      :key="formKey"
      v-model:active="isActive"
      :pool
      :initial="initialQuery"
      @traced="query => writeQuery(query)"
    />
    <VdfRecentDropsCard v-if="!isActive" :pool-id="pool.id" :document="publishedDocument" />
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfRecentDropsCard from '@/modules/vdf/components/overview/VdfRecentDropsCard.vue'
import type { VdfTraceQuery } from '@/modules/vdf/components/trace/VdfTraceForm.vue'
import VdfTracePanel from '@/modules/vdf/components/trace/VdfTracePanel.vue'
import { useVdfPolicy } from '@/modules/vdf/composables/vdf-policy.composable.ts'
import { isEqual } from 'lodash-es'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const route = useRoute()

const router = useRouter()

const { publishedDocument } = useVdfPolicy(() => pool)

// a trace running or shown: the recent drops (quick picks) give way
const isActive = ref(false)

// QUERY: the form starts from the route query, and writes it back on each
// trace. A link that changes the query from outside the form (a quick pick)
// starts a new form.

const readQuery = () => ({ ...route.query }) as VdfTraceQuery

const initialQuery = ref(readQuery())

const formKey = ref(0)

let ownQuery: VdfTraceQuery | undefined

watch(
  () => route.query,
  () => {
    const query = readQuery()

    if (!isEqual(query, ownQuery)) {
      initialQuery.value = query
      formKey.value++
      isActive.value = false
    }
  }
)

function writeQuery(query: VdfTraceQuery) {
  ownQuery = query
  void router.replace({ query })
}
</script>

<style lang="postcss" scoped>
.firewall-trace {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin: 0.8rem;
}
</style>
