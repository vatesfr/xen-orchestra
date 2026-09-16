<template>
  <UiCard>
    <UiTitle>
      {{ t('general-information') }}
    </UiTitle>
    <VtsTabularKeyValueList>
      <VtsTabularKeyValueRow :label="t('name')" :value="vm.name_label" copy />
      <VtsTabularKeyValueRow :label="t('id')" :value="vm.uuid" copy />
      <VtsTabularKeyValueRow :label="t('description')" :value="vm.name_description" />
      <VtsTabularKeyValueRow :label="t('tags')">
        <template v-if="vm.tags.length > 0" #value>
          <UiTagsList>
            <VtsTag v-for="tag in vm.tags" :key="tag" :value="tag" />
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
// POC: ported from `XenApiVm` to `XoVm`.
//
// The XO object already carries `os_version` and `pvDriversVersion`, so this
// component no longer subscribes to the guest-metrics store and no longer
// rebuilds the PV driver version string by hand.
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
import VtsTag from '@core/components/tag/VtsTag.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTagsList from '@core/components/ui/tag/UiTagsList.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import type { XoVm } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { vm } = defineProps<{ vm: XoVm }>()

const { t } = useI18n()
</script>
