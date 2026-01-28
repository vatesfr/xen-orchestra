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
import HostSystemGeneralInformation from '@/modules/host/components/system/HostSystemGeneralInformation.vue'
import HostSystemHardwareSpecifications from '@/modules/host/components/system/HostSystemHardwareSpecifications.vue'
// import HostSystemLicensing from '@/components/host/system/HostSystemLicensing.vue'
import HostSystemNetworking from '@/modules/host/components/system/HostSystemNetworking.vue'
import HostSystemResourceManagement from '@/modules/host/components/system/HostSystemResourceManagement.vue'
import HostSystemSoftwareTooling from '@/modules/host/components/system/HostSystemSoftwareTooling.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

const { host } = defineProps<{
  host: FrontXoHost
}>()
</script>
