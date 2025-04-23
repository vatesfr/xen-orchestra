<!-- vtsQuickInfoRow n'a pas les bonne couleur. proposition de généré depuis un objet -->
<template>
  <UiPanel class="vm-gereral-info">
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
      <template #value>
        <UiTagsList v-for="tag in vm.tags" :key="tag">
          <UiTag accent="info" variant="secondary">{{ tag }}</UiTag>
        </UiTagsList>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('os-name')">
      <template #value>
        <div class="text-ellipsis">
          {{ vm.os_version.name }}
        </div>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('os-kernel')">
      <template #value>
        <div class="text-ellipsis">
          {{ vm.os_version.distro }}
        </div>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('Management-agent-version')">
      <template #value>
        {{ vm.pvDriversVersion }}
      </template>
    </VtsQuickInfoRow>
  </UiPanel>
</template>

<script setup lang="ts">
import type { XoVm } from '@/types/xo/vm.type'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiPanel from '@core/components/ui/panel/UiPanel.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XoVm }>()
</script>

<style lang="postcss" scoped>
.vm-gereral-info {
  background-color: var(--color-neutral-background-primary);
  border-inline-start: none;
}
</style>
