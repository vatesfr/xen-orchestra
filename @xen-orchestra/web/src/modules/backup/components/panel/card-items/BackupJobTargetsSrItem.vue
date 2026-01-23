<template>
  <li>
    <UiLink size="small" icon="object:sr" :href>
      {{ sr.name_label }}
    </UiLink>
  </li>
</template>

<script setup lang="ts">
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XoSr } from '@vates/types'
import { computed } from 'vue'

const { sr } = defineProps<{
  sr: XoSr
}>()

const { buildXo5Route } = useXoRoutes()
const href = computed(() => buildXo5Route(`/srs/${sr.id}/general`))
</script>
