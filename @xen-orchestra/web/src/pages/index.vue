<template>
  <DefaultLayout>
    <template #content><VmStatus /></template>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import VmStatus from '@/components/pool/dashboard/VmStatus.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>
