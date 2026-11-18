<template>
  <VtsTagSelect
    :tags="vm.tags"
    :suggestions="tagSuggestions"
    :icon-only
    :busy="isSaving"
    @save="changes => saveTags(changes)"
  />
</template>

<script lang="ts" setup>
import { useVmTagSuggestions } from '@/modules/vm/composables/use-vm-tag-suggestions.composable.ts'
import { useVmTagsEdition } from '@/modules/vm/composables/use-vm-tags-edition.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsTagSelect from '@core/components/tag-select/VtsTagSelect.vue'

const { vm } = defineProps<{
  vm: FrontXoVm
  iconOnly?: boolean
}>()

const { saveTags, isSaving } = useVmTagsEdition(() => vm)

const { tagSuggestions } = useVmTagSuggestions()
</script>
