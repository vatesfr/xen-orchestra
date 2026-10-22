<template>
  <div class="firewall">
    <VdfFirewallNav :scope="{ kind: 'pool', pool }" />
    <VdfDraftBar :scope="{ kind: 'pool', pool }" />
    <RouterView v-slot="{ Component }">
      <component :is="Component" :pool />
    </RouterView>
  </div>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfDraftBar from '@/modules/vdf/components/VdfDraftBar.vue'
import VdfFirewallNav from '@/modules/vdf/components/VdfFirewallNav.vue'
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const route = useRoute()

const router = useRouter()

watch(
  () => route.name,
  name => {
    if (name === '/pool/[id]/firewall') {
      void router.replace({ name: '/pool/[id]/firewall/overview', params: { id: pool.id }, query: route.query })
    }
  },
  { immediate: true }
)
</script>

<style lang="postcss" scoped>
.firewall {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
