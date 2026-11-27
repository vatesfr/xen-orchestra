<template>
  <UiButton
    :busy="busy || isInstallingUpdate"
    accent="brand"
    left-icon="action:download"
    size="medium"
    variant="primary"
    @click="openInstallUpdateDrawer()"
  >
    {{ t('action:install-update') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useInstallUpdate } from '@/modules/appliance/composables/use-install-update.composable.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

const { channel, currentVersion, nextVersion, busy } = defineProps<{
  channel: string
  busy?: boolean
  currentVersion?: string
  nextVersion?: string
}>()

const emit = defineEmits<{
  upgraded: []
}>()

const { t } = useI18n()

const { openInstallUpdateDrawer, isInstallingUpdate } = useInstallUpdate(
  () => ({ channel, currentVersion, nextVersion }),
  () => emit('upgraded')
)
</script>
