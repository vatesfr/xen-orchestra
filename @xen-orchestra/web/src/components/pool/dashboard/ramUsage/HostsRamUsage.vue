<template>
  <VtsLoadingHero v-if="!isReady" type="card" />
  <template v-else>
    <UiProgressBar
      v-for="ramUsage in ramUsages.hosts.splice(0, 5)"
      :key="ramUsage.id"
      class="progressBar"
      :value="ramUsage.used?.value ?? 0"
      :max="ramUsage.total?.value"
      :legend="ramUsage.name"
    />
  </template>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { computed } from 'vue'

const { hosts } = defineProps<{
  hosts: XoHost[]
}>()

const { isReady } = useHostStore().subscribe()

const ramUsages = computed(() => {
  return {
    hosts: hosts
      .map(host => {
        return {
          total: formatSizeRaw(host.memory.size, 0),
          used: formatSizeRaw(host.memory.usage, 0),
          free: formatSizeRaw(host.memory.size - host.memory.usage, 0),
          id: host.id,
          name: host.name_label,
        }
      })
      .sort(
        (a, b) =>
          // reproduce calcul in progress bar.
          (b.used?.value ?? 0) / ((b.total?.value ?? 0) > 1 ? b.total!.value : 1) -
          (a.used?.value ?? 0) / ((a.total?.value ?? 0) > 1 ? a.total!.value : 1)
      ),
  }
})
</script>
