<template>
  <div class="v2v-mapping-vm-header">
    <InlineParts separator="chevron" class="location typo-body-regular-small">
      <span v-for="part of heading.locationParts" :key="part">{{ part }}</span>
    </InlineParts>
    <UiHeadBar>
      {{ heading.name }}
      <template v-if="heading.statusTag" #status>
        <UiTag :accent="heading.statusTag.accent" variant="secondary">{{ heading.statusTag.label }}</UiTag>
      </template>
      <template #actions>
        <UiButton v-if="action === 'remove'" accent="brand" variant="secondary" size="medium" @click="emit('remove')">
          {{ t('action:remove-from-list') }}
        </UiButton>
        <UiButton v-else accent="danger" variant="secondary" size="medium" :busy @click="emit('delete')">
          {{ t('action:delete') }}
        </UiButton>
      </template>
    </UiHeadBar>
  </div>
</template>

<script lang="ts" setup>
import type { V2vMappingVmHeading } from '@/modules/v2v/composables/use-v2v-mapping-step.composable.ts'
import InlineParts from '@/shared/components/InlineParts.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import { useI18n } from 'vue-i18n'

// A new VM leaves the list; a resumed one has its import VM deleted, to be imported again as new
defineProps<{
  heading: V2vMappingVmHeading
  action: 'remove' | 'delete'
  busy?: boolean
}>()

const emit = defineEmits<{
  remove: []
  delete: []
}>()

const { t } = useI18n()
</script>

<style lang="postcss" scoped>
.v2v-mapping-vm-header {
  display: flex;
  flex-direction: column;
  background-color: var(--color-neutral-background-primary);

  .location {
    padding: 0.8rem 1.6rem 0;
    color: var(--color-neutral-txt-secondary);
  }
}
</style>
