<template>
  <VdfGate :pool-id="pool.id">
    <div class="firewall">
      <VdfFirewallNav :scope="{ kind: 'pool', pool }" />
      <div class="main">
        <VdfFirewallBar :scope="{ kind: 'pool', pool }" />
        <VdfDraftBar :scope="{ kind: 'pool', pool }" />
        <!-- vdf#141: protected VMs on a host without a working agent; the overview lists them itself -->
        <VdfUnenforcedAlert
          v-if="route.name !== '/pool/[id]/firewall/overview'"
          :pool-id="pool.id"
          class="unenforced"
        />
        <RouterView v-slot="{ Component }">
          <component :is="Component" :pool />
        </RouterView>
      </div>
    </div>
  </VdfGate>
</template>

<script lang="ts" setup>
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfDraftBar from '@/modules/vdf/components/VdfDraftBar.vue'
import VdfFirewallBar from '@/modules/vdf/components/VdfFirewallBar.vue'
import VdfFirewallNav from '@/modules/vdf/components/VdfFirewallNav.vue'
import VdfGate from '@/modules/vdf/components/VdfGate.vue'
import VdfUnenforcedAlert from '@/modules/vdf/components/VdfUnenforcedAlert.vue'
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const { pool } = defineProps<{
  pool: FrontXoPool
}>()

const route = useRoute()

const router = useRouter()

// /pool/<id>/firewall opens the Overview. Not with useDefaultTab(), as the
// object pages do: it remembers a single page/tab pair in localStorage, so
// using it here, nested under /pool/[id], would overwrite the pool's own
// remembered tab.
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
/* the list of pages beside them, as vSphere's Configure */
.firewall {
  display: flex;
  flex-shrink: 0;
  align-items: stretch;
  min-height: 100%;

  .main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  .unenforced {
    margin: 0.8rem 0.8rem 0;
  }
}
</style>
