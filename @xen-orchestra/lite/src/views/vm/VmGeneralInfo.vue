<template>
  <UiCard class="vm-general-info">
    <UiTitle>
      {{ $t('general-information') }}
    </UiTitle>
    <VtsQuickInfoRow :label="$t('name')" :value="vm?.name_label" />
    <VtsQuickInfoRow :label="$t('id')" :value="vm?.uuid" />
    <VtsQuickInfoRow :label="$t('description')" :value="vm?.name_description" />
    <VtsQuickInfoRow :label="$t('tags')">
      <template v-if="vm && vm.tags.length > 0" #value>
        <UiTagsList>
          <UiTag v-for="tag in vm.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
        </UiTagsList>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="$t('os-name')" :value="vm?.reference_label" />
    <VtsQuickInfoRow :label="$t('os-kernel')" :value="vm?.uuid" />
    <VtsQuickInfoRow :label="$t('management-agent-version')" :value="vm?.uuid" />
  </UiCard>
</template>

<script setup lang="ts">
import type { XenApiVm } from '@/libs/xen-api/xen-api.types'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'

const { vm } = defineProps<{ vm: XenApiVm | undefined }>()
/* not found:
vm?.os_version?.uname
vm.pvDriversVersion
*/
</script>
