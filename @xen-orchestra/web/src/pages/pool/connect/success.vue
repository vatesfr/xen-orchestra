<template>
  <!--  <VtsStateHero type="page" image="all-good" :title="$t('connect-to-ip', { ip: props.host })"> -->
  <!--    <UiAlert accent="success" /> -->
  <!--  </VtsStateHero> -->
  <div>{{ t('here') }}</div>
</template>

<script setup lang="ts">
// import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
// import UiAlert from '@core/components/ui/alert/UiAlert.vue'
// const props = defineProps<any>()

// console.log(props)
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
