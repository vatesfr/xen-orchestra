<template>
  <VtsDrawer :dismissible :current>
    <template #title>Drawer Title</template>
    <template #content>
      <p>This is the drawer content.</p>
    </template>
    <template #buttons>
      <VtsDrawerCancelButton />
      <VtsDrawerConfirmButton>Confirm</VtsDrawerConfirmButton>
    </template>
  </VtsDrawer>
</template>

<script lang="ts" setup>
import VtsDrawer from '@core/components/drawer/VtsDrawer.vue'
import VtsDrawerCancelButton from '@core/components/drawer/VtsDrawerCancelButton.vue'
import VtsDrawerConfirmButton from '@core/components/drawer/VtsDrawerConfirmButton.vue'

defineProps<{
  dismissible?: boolean
  current?: boolean
}>()
</script>
