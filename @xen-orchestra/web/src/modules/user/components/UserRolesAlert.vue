<template>
  <UiAlert v-if="!isDismissed" accent="info" close @close="isDismissed = true">
    {{ t('alert-user-roles') }}
  </UiAlert>
</template>

<script lang="ts" setup>
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const isDismissed = ref(false)
</script>
