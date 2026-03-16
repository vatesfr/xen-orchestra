<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsQuickInfoRow :label="t('name')">
      <template #value>
        {{ vm.name_label }}
        <VtsCopyButton v-if="vm.name_label" :value="vm.name_label" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('id')">
      <template #value>
        {{ vm.id }}
        <VtsCopyButton :value="vm.id" />
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('description')" :value="vm.name_description" />
    <VtsQuickInfoRow :label="t('tags')">
      <template v-if="vm.tags.length > 0" #value>
        <UiTagsList>
          <UiTag v-for="tag in vm.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
        </UiTagsList>
      </template>
    </VtsQuickInfoRow>
    <VtsQuickInfoRow :label="t('os-name')" :value="vm.os_version?.name" />
    <VtsQuickInfoRow :label="t('os-kernel')" :value="vm.os_version?.uname" />
    <VtsQuickInfoRow :label="t('management-agent-version')" :value="vm.pvDriversVersion" />
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import VtsQuickInfoRow from '@core/components/quick-info-row/VtsQuickInfoRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()
</script>
