<template>
  <!--  <UiButton -->
  <!--    v-tooltip="!canEnableHost && enableHostErrorMessage" -->
  <!--    size="medium" -->
  <!--    variant="tertiary" -->
  <!--    accent="brand" -->
  <!--    :disabled="!canEnableHost" -->
  <!--    left-icon="status:success-circle" -->
  <!--    :busy="isEnablingHost" -->
  <!--    @click="openEnabledStateModal()" -->
  <!--  > -->
  <!--    {{ t('action:shutdown') }} -->
  <!--  </UiButton> -->

  <UiButton size="medium" variant="tertiary" accent="brand" left-icon="action:shutdown">
    {{ t('action:shutdown') }}
  </UiButton>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()
</script>
