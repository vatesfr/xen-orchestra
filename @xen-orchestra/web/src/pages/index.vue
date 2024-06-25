<template>
  <DefaultLayout>
    <template #content>
      <PoolDashboardStatus />
    </template>
  </DefaultLayout>
</template>

<script lang="ts" setup>
import PoolDashboardStatus from '@/components/pool/dashboard/PoolDashboardStatus.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
</script>
