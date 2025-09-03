<template>
  <div class="alarm-link">
    <UiLink size="small" :to="route" icon="fa:desktop">
      {{ nameLabel }}
    </UiLink>
  </div>
</template>

<script setup lang="ts" generic="TRecord extends XapiXoRecord">
import { useXoVmCollection } from '@/remote-resources/use-xo-vm-collection.ts'
import type { XoVm } from '@/types/xo/vm.type.ts'
import UiLink from '@core/components/ui/link/UiLink.vue'
import type { XapiXoRecord } from '@vates/types'
import { computed } from 'vue'

const { type, uuid } = defineProps<{
  type: TRecord['type'] | 'unknown'
  uuid: TRecord['uuid']
}>()

const { getVmById } = useXoVmCollection()

const vm = computed(() => getVmById(uuid as XoVm['id']))

const nameLabel = computed(() => vm.value?.name_label ?? uuid)

const route = computed(() => {
  if (!vm.value) {
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
