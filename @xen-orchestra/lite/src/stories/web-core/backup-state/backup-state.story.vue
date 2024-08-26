<template>
  <ComponentStory
    v-slot="{ properties }"
    :params="[
      prop('state').type(`'BackupState`).required().enum('success', 'partial', 'failure').preset('success').widget(),
    ]"
  >
    <BackupState v-bind="properties" />
  </ComponentStory>
</template>

<script lang="ts" setup>
import ComponentStory from '@/components/component-story/ComponentStory.vue'
import { prop } from '@/libs/story/story-param'
import BackupState from '@core/components/backup-state/BackupState.vue'
</script>
