<template>
  <UiHeadBar icon="fa:satellite">
    {{ XOA_NAME }}
    <template #actions>
      <ApplianceCheckUpdatesButton />
    </template>
  </UiHeadBar>
</template>

<script lang="ts" setup>
import ApplianceCheckUpdatesButton from '@/modules/appliance/components/actions/check-updates/ApplianceCheckUpdatesButton.vue'
import { XOA_NAME } from '@/shared/constants.ts'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'
</script>
