<template>
  <li>
    <UiLink size="small" :icon="srStatusIcon" :to="{ name: '/sr/[id]/general', params: { id: sr.id } }">
      {{ sr.name_label }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'

const { sr } = defineProps<{
  sr: FrontXoSr
}>()

const { srStatusIcon } = useXoSrUtils(() => sr)
</script>
