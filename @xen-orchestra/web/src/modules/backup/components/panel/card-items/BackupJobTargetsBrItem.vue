<template>
  <li>
    <UiLink size="small" :icon :href>
      {{ br.name }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoBackupRepository } from '@vates/types'
import { computed } from 'vue'

const { br } = defineProps<{
  br: XoBackupRepository
}>()
const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route('/settings/remotes'))

const icon = computed(() =>
  br.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected'
)
</script>
