<template>
  <div class="alarm-link">
    <UiLink size="small" :to="route" icon="fa:server">
      {{ nameLabel }}
    </UiLink>
  </div>
</template>

<script setup lang="ts" generic="TRecord extends XapiXoRecord">
import { useXoHostCollection } from '@/remote-resources/use-xo-host-collection.ts'
import type { XoHost } from '@/types/xo/host.type.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XapiXoRecord } from '@vates/types'
import { computed } from 'vue'

const { type, uuid } = defineProps<{
  type: TRecord['type'] | 'unknown'
  uuid: TRecord['uuid']
}>()

const { getHostById } = useXoHostCollection()

const host = computed(() => getHostById(uuid as XoHost['id']))

const nameLabel = computed(() => host.value?.name_label ?? uuid)

const route = computed(() => {
  if (!host.value) {
    return undefined
  }

  return `/${type}/${uuid}`
})
</script>

<style lang="postcss" scoped>
.alarm-link {
  align-items: center;
  line-height: 1;
}
</style>
