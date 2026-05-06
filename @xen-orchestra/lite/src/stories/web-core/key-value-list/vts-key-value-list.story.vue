<template>
  <ComponentStory :params="[slot().help('Meant to receive VtsKeyValueRow components')]">
    <VtsKeyValueList>
      <VtsKeyValueRow label="Operating System" value="XenServer 8.3" />
      <VtsKeyValueRow label="CPUs" value="4 vCPUs" />
      <VtsKeyValueRow label="RAM" value="8 GiB" />
      <VtsKeyValueRow label="IP Address" value="192.168.1.10" />
    </VtsKeyValueList>
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { slot } from '@/libs/story/story-param'
import VtsKeyValueList from '@core/components/key-value-list/VtsKeyValueList.vue'
import VtsKeyValueRow from '@core/components/key-value-row/VtsKeyValueRow.vue'
</script>
