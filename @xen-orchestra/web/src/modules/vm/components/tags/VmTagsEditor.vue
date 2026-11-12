<template>
  <UiTagsList>
    <VtsTag
      v-for="{ tag, accent } of vmTags"
      :key="tag"
      v-tooltip="getTagLock(tag) ?? false"
      :accent
      :value="tag"
      :wrap
    />
    <VmTagSelect :vm :icon-only />
  </UiTagsList>
</template>

<script lang="ts" setup>
import VmTagSelect from '@/modules/vm/components/tags/VmTagSelect.vue'
import { useVmReservedTags } from '@/modules/vm/composables/use-vm-reserved-tags.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmTagAccent } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { computed } from 'vue'

const { vm } = defineProps<{
  vm: FrontXoVm
  iconOnly?: boolean
  wrap?: boolean
}>()

const { getTagLock } = useVmReservedTags(() => vm)

const vmTags = computed(() => vm.tags.map(tag => ({ tag, accent: getVmTagAccent(tag) })))
</script>
