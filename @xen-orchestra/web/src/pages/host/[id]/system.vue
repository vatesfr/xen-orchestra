<template>
  <VtsColumns>
    <VtsColumn>
      <HostSystemGeneralInformation :host />
      <HostSystemNetworking :host />
      <HostSystemResourceManagement :host />
    </VtsColumn>
    <VtsColumn>
      <!--    Todo: wait for the licenses availability -->
      <!--    <HostSystemLicensing  /> -->
      <HostSystemSoftwareTooling :host />
      <HostSystemHardwareSpecifications :host />
    </VtsColumn>
  </VtsColumns>
</template>

<script lang="ts" setup>
import HostSystemGeneralInformation from '@/components/host/system/HostSystemGeneralInformation.vue'
import HostSystemHardwareSpecifications from '@/components/host/system/HostSystemHardwareSpecifications.vue'
// import HostSystemLicensing from '@/components/host/system/HostSystemLicensing.vue'
import HostSystemNetworking from '@/components/host/system/HostSystemNetworking.vue'
import HostSystemResourceManagement from '@/components/host/system/HostSystemResourceManagement.vue'
import HostSystemSoftwareTooling from '@/components/host/system/HostSystemSoftwareTooling.vue'
import { type XoHost } from '@/types/xo/host.type'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

const { host } = defineProps<{
  host: XoHost
}>()
</script>
