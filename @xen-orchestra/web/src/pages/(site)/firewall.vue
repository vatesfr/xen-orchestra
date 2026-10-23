<template>
  <div class="firewall">
    <VdfFirewallNav :scope />
    <VdfDraftBar :scope />
    <RouterView />
  </div>
</template>

<script lang="ts" setup>
import VdfDraftBar from '@/modules/vdf/components/VdfDraftBar.vue'
import VdfFirewallNav from '@/modules/vdf/components/VdfFirewallNav.vue'
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
.firewall {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>
