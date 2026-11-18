<template>
  <div class="vm-tags-editor">
    <div class="header">
      <span class="label">{{ t('tags') }}</span>
      <VmTagSelect :vm :icon-only />
      <div v-if="slots.addons" class="addons">
        <slot name="addons" />
      </div>
    </div>
    <UiTagsList v-if="sortedTags.length > 0">
      <VtsTag v-for="tag of sortedTags" :key="tag" :value="tag" :wrap accent="brand" />
    </UiTagsList>
  </div>
</template>

<script lang="ts" setup>
import VmTagSelect from '@/modules/vm/components/tags/VmTagSelect.vue'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import { sortTags } from '@core/utils/sort-tags.util.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{
  vm: FrontXoVm
  iconOnly?: boolean
  wrap?: boolean
}>()

const slots = defineSlots<{
  addons?(): any
}>()

const { t } = useI18n()

const sortedTags = computed(() => sortTags(vm.tags))
</script>

<style lang="postcss" scoped>
.vm-tags-editor {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  .header {
    display: flex;
    align-items: center;
    gap: 0.8rem;

    .label {
      color: var(--color-neutral-txt-secondary);
    }

    .addons {
      display: flex;
      gap: 0.8rem;
      margin-inline-start: auto;
    }
  }
}
</style>
