<template>
  <UiTagsList>
    <VtsTag v-for="{ tag, accent } of vmTags" :key="tag" :accent :value="tag" :wrap />
    <VmTagSelect :vm :icon-only />
  </UiTagsList>
</template>

<script lang="ts" setup>
import VmTagSelect from '@/modules/vm/components/tags/VmTagSelect.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmTagAccent } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { computed } from 'vue'

const { vm } = defineProps<{
  vm: FrontXoVm
  iconOnly?: boolean
  wrap?: boolean
}>()

const vmTags = computed(() => vm.tags.map(tag => ({ tag, accent: getVmTagAccent(tag) })))
</script>
