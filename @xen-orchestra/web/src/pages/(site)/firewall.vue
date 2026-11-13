<template>
  <VdfGate>
    <div class="firewall">
      <VdfFirewallNav :scope />
      <div class="main">
        <VdfFirewallBar :scope />
        <VdfDraftBar :scope />
        <!-- vdf#141: protected VMs on a host without a working agent, in every pool; the overview says it itself -->
        <VdfUnenforcedAlert v-if="route.name !== '/(site)/firewall/overview'" class="unenforced" />
        <RouterView />
      </div>
    </div>
  </VdfGate>
</template>

<script lang="ts" setup>
import VdfDraftBar from '@/modules/vdf/components/VdfDraftBar.vue'
import VdfFirewallBar from '@/modules/vdf/components/VdfFirewallBar.vue'
import VdfFirewallNav from '@/modules/vdf/components/VdfFirewallNav.vue'
import VdfGate from '@/modules/vdf/components/VdfGate.vue'
import VdfUnenforcedAlert from '@/modules/vdf/components/VdfUnenforcedAlert.vue'
import type { VdfScope } from '@/modules/vdf/composables/vdf-scope.composable.ts'
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// the XO-wide configuration, written into every pool in scope
const scope: VdfScope = { kind: 'global' }

const route = useRoute()

const router = useRouter()

// /firewall opens the Overview. Not with useDefaultTab(), as the object
// pages do: it remembers a single page/tab pair in localStorage, so using
// it here, nested under /(site), would overwrite the site's own remembered
// tab.
watch(
  () => route.name,
  name => {
    if (name === '/(site)/firewall') {
      void router.replace({ name: '/(site)/firewall/overview', query: route.query })
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
