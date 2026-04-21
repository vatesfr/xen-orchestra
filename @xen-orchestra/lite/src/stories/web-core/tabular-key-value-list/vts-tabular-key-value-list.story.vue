<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[prop('fullHeight').bool().widget(), slot().help('Meant to receive VtsTabularKeyValueRow components')]"
  >
    <VtsTabularKeyValueList v-bind="properties">
      <VtsTabularKeyValueRow label="Operating System" value="XenServer 8.3" />
      <VtsTabularKeyValueRow label="CPUs" value="4 vCPUs" />
      <VtsTabularKeyValueRow label="RAM" value="8 GiB" />
      <VtsTabularKeyValueRow label="IP Address" value="192.168.1.10" />
    </VtsTabularKeyValueList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop, slot } from '@/libs/story/story-param'
import VtsTabularKeyValueList from '@core/components/tabular-key-value-list/VtsTabularKeyValueList.vue'
import VtsTabularKeyValueRow from '@core/components/tabular-key-value-row/VtsTabularKeyValueRow.vue'
</script>
