<template>
  <VtsLoadingHero v-if="!isReady" type="card" />
  <template v-else>
    <UiProgressBar
      v-for="host in hosts"
      :key="host.id"
      class="progressBar"
      :value="host.memory.usage"
      :max="host.memory.size"
      :legend="host.name_label"
    />
  </template>
</template>

<script lang="ts" setup>
import { useHostStore } from '@/stores/xo-rest-api/host.store.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import VtsLoadingHero from '@core/components/state-hero/VtsLoadingHero.vue'
import UiProgressBar from '@core/components/ui/progress-bar/UiProgressBar.vue'

const { hosts } = defineProps<{
  hosts: XoHost[]
}>()

const { isReady } = useHostStore().subscribe()
</script>
