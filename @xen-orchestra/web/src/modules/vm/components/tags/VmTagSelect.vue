<template>
  <VtsTagSelect
    :tags="vm.tags"
    :suggestions="unlockedSuggestions"
    :tag-accent="getVmTagAccent"
    :tag-lock="getTagLock"
    :icon-only
    :busy-tags
    @add="addTag"
    @remove="removeTag"
  />
</template>

<script lang="ts" setup>
import { useVmReservedTags } from '@/modules/vm/composables/use-vm-reserved-tags.composable.ts'
import { useVmTagSuggestions } from '@/modules/vm/composables/use-vm-tag-suggestions.composable.ts'
import { useVmTagsEdition } from '@/modules/vm/composables/use-vm-tags-edition.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { getVmTagAccent } from '@/modules/vm/utils/xo-vm.util.ts'
import VtsTagSelect from '@core/components/tag-select/VtsTagSelect.vue'
import { computed } from 'vue'

const { vm } = defineProps<{
  vm: FrontXoVm
  iconOnly?: boolean
}>()

const { addTag, removeTag, busyTags } = useVmTagsEdition(() => vm)

const { tagSuggestions } = useVmTagSuggestions()

const { getTagLock } = useVmReservedTags(() => vm)

// the VM's own tags stay listed (locked if they can't be removed); the
// others only if they can be added
const unlockedSuggestions = computed(() =>
  tagSuggestions.value.filter(({ tag }) => vm.tags.includes(tag) || getTagLock(tag, 'add') === undefined)
)
</script>
