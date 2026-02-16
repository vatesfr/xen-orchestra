<template>
  <li>
    <UiLink size="small" :icon="srStatusIcon" :href>
      {{ sr.name_label }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import { computed } from 'vue'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route(`/srs/${sr.id}/general`))

const { srStatusIcon } = useXoSrUtils(() => sr)
</script>
