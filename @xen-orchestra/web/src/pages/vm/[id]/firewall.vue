<template>
  <VdfGate :pool-id="vm.$pool">
    <!-- a direct link can get the VM before the pool collection: the tab waits for its pool -->
    <VtsStateHero v-if="pool === undefined" format="page" type="busy" size="medium" class="vm-firewall-state" />
    <VdfVmFirewall v-else :vm :pool />
  </VdfGate>
</template>

<script lang="ts" setup>
import { useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import VdfGate from '@/modules/vdf/components/VdfGate.vue'
import VdfVmFirewall from '@/modules/vdf/components/vm/VdfVmFirewall.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'

const { vm } = defineProps<{
  vm: FrontXoVm
}>()

const { useGetPoolById } = useXoPoolCollection()

const pool = useGetPoolById(() => vm.$pool)
</script>

<style lang="postcss" scoped>
.vm-firewall-state {
  margin: 0.8rem;
}
</style>
