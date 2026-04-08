<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="vm.name_label" />
      <VtsTabularKeyValueRow :label="t('id')" :value="vm.id" />
      <VtsTabularKeyValueRow :label="t('description')" :value="vm.name_description" />
      <VtsTabularKeyValueRow :label="t('tags')">
        <template v-if="vm.tags.length > 0" #value>
          <UiTagsList>
            <UiTag v-for="tag in vm.tags" :key="tag" accent="info" variant="secondary">{{ tag }}</UiTag>
          </UiTagsList>
        </template>
      </VtsTabularKeyValueRow>
      <VtsTabularKeyValueRow :label="t('os-name')" :value="vm.os_version?.name" />
      <VtsTabularKeyValueRow :label="t('os-kernel')" :value="vm.os_version?.uname" />
      <VtsTabularKeyValueRow :label="t('management-agent-version')" :value="vm.pvDriversVersion" />
    </VtsTabularKeyValueList>
  </UiCard>
</template>

<script setup lang="ts">
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTag from '@core/components/ui/tag/UiTag.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { useI18n } from 'vue-i18n'

defineProps<{ vm: FrontXoVm }>()

const { t } = useI18n()
</script>
