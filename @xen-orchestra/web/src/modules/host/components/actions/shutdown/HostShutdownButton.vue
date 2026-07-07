<template>
  <UiButton size="medium" variant="tertiary" accent="brand" left-icon="status:success-circle">
    {{ t('action:shutdown') }}
  </UiButton>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { host } = defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()
</script>
