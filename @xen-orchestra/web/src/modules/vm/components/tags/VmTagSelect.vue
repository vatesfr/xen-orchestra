<template>
  <VtsTagSelect
    :tags="vm.tags"
    :suggestions="tagSuggestions"
    :tag-accent="getVmTagAccent"
    :icon-only
    :busy-tags
    @add="addTag"
    @remove="removeTag"
  />
</template>

<script lang="ts" setup>
import { useVmTagSuggestions } from '@/modules/vm/composables/use-vm-tag-suggestions.composable.ts'
import { useVmTagsEdition } from '@/modules/vm/composables/use-vm-tags-edition.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmTagAccent } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsTagSelect from '@core/components/tag-select/VtsTagSelect.vue'

const { vm } = defineProps<{
  vm: FrontXoVm
  iconOnly?: boolean
}>()

const { addTag, removeTag, busyTags } = useVmTagsEdition(() => vm)

const { tagSuggestions } = useVmTagSuggestions()
</script>
