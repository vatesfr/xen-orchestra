<template>
  <VtsInputWrapper :label :message="messages" wrap-message>
    <VtsSelect :id accent="brand">
      <template #default="{ option }">
        <VtsDropdownTitle v-if="groupStartOptionIds.has(option.id)">{{ option.source.group }}</VtsDropdownTitle>
        <VtsOption :option />
      </template>
    </VtsSelect>
  </VtsInputWrapper>
</template>

<script lang="ts" setup>
import { mergeInputMessages } from '@/modules/kubernetes/utils/kubernetes-form-input.util.ts'
import type { InputWrapperMessage } from '@core/components/input-wrapper/VtsInputWrapper.vue'
import type { CollectionItemId, CollectionItemProperties } from '@core/packages/collection'
import type { FormSelectId } from '@core/packages/form-select'
import VtsDropdownTitle from '@core/components/dropdown/VtsDropdownTitle.vue'
import VtsInputWrapper from '@core/components/input-wrapper/VtsInputWrapper.vue'
import VtsOption from '@core/components/select/VtsOption.vue'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { computed, inject } from 'vue'

const { id, info, warning, error } = defineProps<{
  // Options with a `group` are displayed under a separator, one per group
  id: FormSelectId<CollectionItemProperties, { group?: string }>
  label: string
  info?: string
  warning?: InputWrapperMessage
  error?: InputWrapperMessage
}>()

const messages = computed(() => mergeInputMessages(info, warning, error))

const select = inject(id)

// Computed on the filtered options so that a separator is still displayed above the first matching option of a group
const groupStartOptionIds = computed(() => {
  const ids = new Set<CollectionItemId>()
  let previousGroup: string | undefined

  for (const option of select?.options.value ?? []) {
    const { group } = option.source

    if (group !== undefined && group !== previousGroup) {
      ids.add(option.id)
    }

    previousGroup = group
  }

  return ids
})
</script>
