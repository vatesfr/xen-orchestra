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
  <!--    {{ t('action:start') }} -->
  <!--  </UiButton> -->

  <MenuItem size="medium" variant="tertiary" accent="brand" icon="fa:play">
    {{ t('action:start') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  host: FrontXoHost
}>()

const { t } = useI18n()
</script>
