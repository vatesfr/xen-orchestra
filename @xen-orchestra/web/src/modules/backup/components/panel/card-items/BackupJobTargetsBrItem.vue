<template>
  <li>
    <UiLink size="small" :icon :href>
      {{ br.name }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import type { FrontXoBackupRepository } from '@/modules/backup/remote-resources/use-xo-br-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()
const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route('/settings/remotes'))

const icon = computed(() => (br.enabled ? 'object:br:connected' : 'object:br:disconnected'))
</script>
