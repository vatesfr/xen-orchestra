<template>
  <div class="system" :class="{ mobile: uiStore.isMobile }">
    <HostSystemGeneralInformation class="general" :host />
    <HostSystemNetworking class="networking" :host />
    <HostSystemResourceManagement class="resource" :host />
    <!--    Todo: wait for the licenses availability -->
    <!--    <HostSystemLicensing class="licensing" /> -->
    <HostSystemSoftwareTooling class="software" :host />
    <HostSystemHardwareSpecifications class="hardware" :host />
  </div>
</template>

<script lang="ts" setup>
import HostSystemGeneralInformation from '@/components/host/system/HostSystemGeneralInformation.vue'
import HostSystemHardwareSpecifications from '@/components/host/system/HostSystemHardwareSpecifications.vue'
// import HostSystemLicensing from '@/components/host/system/HostSystemLicensing.vue'
import HostSystemNetworking from '@/components/host/system/HostSystemNetworking.vue'
import HostSystemResourceManagement from '@/components/host/system/HostSystemResourceManagement.vue'
import HostSystemSoftwareTooling from '@/components/host/system/HostSystemSoftwareTooling.vue'
import { type XoHost } from '@/types/xo/host.type'
import { useUiStore } from '@core/stores/ui.store.ts'

const { host } = defineProps<{
  host: XoHost
}>()

const uiStore = useUiStore()
</script>

<style lang="postcss" scoped>
.system {
  column-count: 2;
  column-gap: 0.8rem;
  margin: 0.8rem;

  & > * {
    break-inside: avoid;
    margin-bottom: 0.8rem;
  }

  &.mobile {
    column-count: 1;
  }
}
</style>
