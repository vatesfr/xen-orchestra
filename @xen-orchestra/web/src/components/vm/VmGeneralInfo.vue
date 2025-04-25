<template>
  <UiCard class="vm-general-info">
    <UiTitle>
      {{ $t('general-information') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('name')">
      <template #value>
        <div class="text-ellipsis">
          {{ vm.name_label }}
        </div>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('id')">
      <template #value>
        <div class="text-ellipsis">
          {{ vm.name_label }}
        </div>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('name')">
      <template #value>
        <div class="text-ellipsis">
          {{ vm.id }}
        </div>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('description')">
      <template #value>
        <div class="text-ellipsis">
          {{ vm.name_description }}
        </div>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('tags')">
      <template v-if="tags.length > 0" #value>
        <div class="tag-list">
          <UiTagsList v-for="tag in tags" :key="tag">
            <UiTag accent="info" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </div>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('os-name')">
      <template #value>
        <div v-if="vm.os_version.name" class="text-ellipsis">
          {{ vm.os_version.name }}
        </div>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('os-kernel')">
      <template #value>
        <div v-if="vm.os_version.name" class="text-ellipsis">
          {{ vm.os_version.distro }}
        </div>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Management-agent-version')">
      <template #value>
        {{ vm.pvDriversVersion }}
      </template>
    </VtsQuickInfoRow>
  </UiCard>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XoVm }>()
const tags = vm.tags.filter(tag => tag !== '')
</script>

<style lang="postcss" scoped>
.vm-general-info {
  background-color: var(--color-neutral-background-primary);
  border-inline-start: none;

  .tag-list {
    display: flex;
    gap: 0.8rem;
  }
}
</style>
