<template>
  <UiInfo accent="danger" wrap>{{ PENDING_MOCKUP_MESSAGE }}</UiInfo>
</template>

<script lang="ts" setup>
import UiInfo from '@core/components/ui/info/UiInfo.vue'

const PENDING_MOCKUP_MESSAGE = 'TODO: en attente de maquettes pour cette zone'
</script>
