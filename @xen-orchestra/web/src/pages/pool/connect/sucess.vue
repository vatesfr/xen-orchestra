<template>
  <VtsStateHero type="page" image="all-good" :title="$t('connect-to-ip', { ip: props.host })">
    <UiAlert accent="success" />
  </VtsStateHero>
</template>

<script setup lang="ts">
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
const props = defineProps<any>()

// console.log(props)
</script>
