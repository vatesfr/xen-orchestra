<template>
  <!--  <UiButton -->
  <!--    v-tooltip="!canDisableHost && disableHostErrorMessage" -->
  <!--    size="medium" -->
  <!--    variant="tertiary" -->
  <!--    accent="brand" -->
  <!--    :disabled="!canDisableHost || hostIsHalted" -->
  <!--    left-icon="action:disable" -->
  <!--    :busy="isDisablingHost" -->
  <!--    @click="openEnabledStateModal()" -->
  <!--  > -->
  <!--    {{ t('action:disable-host-and-evacuate-vms') }} -->
  <!--  </UiButton> -->
  <MenuItem size="medium" icon="action:disable-and-evacuate">
    {{ t('action:disable-host-and-evacuate-vms') }}
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
